import { renderIndex } from "./template.js";

const jsonResponse = (data, status = 200, maxAge = 60) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": maxAge > 0 ? `public, max-age=${maxAge}` : "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const getConfig = (env) => ({
  intervalMs: Number(env.POST_INTERVAL_MS) || 300000,
  cpmToUsv: Number(env.CPM_TO_USV) || 0.0018
});

async function handleIngest(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (auth !== `Bearer ${env.DEVICE_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const now = Date.now();
  const clicks = body.clicks || 0;

  await env.RAD_KV.put("latest", JSON.stringify({ clicks, ts: now, receivedAt: now }));

  try {
    await env.RAD_D1.prepare(
      `INSERT INTO readings (ts, clicks) VALUES (?, ?);`
    ).bind(now, clicks).run();
  } catch (e) {
    console.error("D1 historical insert failed, but KV succeeded:", e);
  }

  return new Response("OK");
}

async function handleLatest(env) {
  const latestRaw = await env.RAD_KV.get("latest");
  const latest = latestRaw ? JSON.parse(latestRaw) : null;

  let totalClicks = 0;
  try {
    const since = Date.now() - 3600_000;
    const query = await env.RAD_D1.prepare(
      "SELECT SUM(clicks) AS s FROM readings WHERE ts >= ?;"
    ).bind(since).all();
    totalClicks = query.results?.[0]?.s || 0;
  } catch (e) {
    console.error("D1 hourly aggregate query failed:", e);
  }

  const cfg = getConfig(env);
  const cpmValue = totalClicks / 60;
  const avg_usv = cpmValue * cfg.cpmToUsv;

  const cpm_from_latest = latest ? latest.clicks / (cfg.intervalMs / 60000) : 0;
  const instant_usv = cpm_from_latest * cfg.cpmToUsv;

  const lastUpdate = latest?.receivedAt || 0;
  const diffMs = Date.now() - lastUpdate;
  const offline = diffMs > 600_000;

  return jsonResponse({
    latest,
    cpm: cpm_from_latest,
    instant_usv,
    avg_usv,
    unit: "µSv/h",
    offline,
    lastSeenAgo: diffMs,
  });
}

async function handleHistory(url, env) {
  const w = url.searchParams.get("window") || "1hr";
  const windows = {
    "1hr": 60 * 60e3,
    "12hr": 12 * 3600e3,
    "1day": 24 * 3600e3,
    "3day": 3 * 86400e3,
    "7day": 7 * 86400e3,
    "15day": 15 * 86400e3,
    "35day": 35 * 86400e3,
    "70day": 70 * 86400e3,
    "140day": 140 * 86400e3,
  };
  const ms = windows[w] || windows["1hr"];
  const since = Date.now() - ms;

  let bucketMs = 0;
  if (w === "12hr") bucketMs = 10 * 60e3;
  else if (w === "1day") bucketMs = 30 * 60e3;
  else if (w === "3day") bucketMs = 3600e3;
  else if (w === "7day") bucketMs = 2 * 3600e3;
  else if (w === "15day") bucketMs = 4 * 3600e3;
  else if (w === "35day") bucketMs = 8 * 3600e3;
  else if (w === "70day") bucketMs = 16 * 3600e3;
  else if (w === "140day") bucketMs = 24 * 3600e3;

  try {
    let query = "SELECT ts, clicks FROM readings WHERE ts >= ? ORDER BY ts ASC;";
    if (bucketMs > 0) {
      query = `SELECT (CAST(ts / ${bucketMs} AS INTEGER)) * ${bucketMs} as ts, AVG(clicks) as clicks FROM readings WHERE ts >= ? GROUP BY CAST(ts / ${bucketMs} AS INTEGER) ORDER BY ts ASC;`;
    }

    const rows = await env.RAD_D1.prepare(query).bind(since).all();

    const cfg = getConfig(env);
    const data = rows.results.map(r => ({
      ts: r.ts,
      usv: (r.clicks / (cfg.intervalMs / 60000)) * cfg.cpmToUsv,
    }));

    let maxAge = 60;
    if (w === "12hr" || w === "1day") maxAge = 300;
    else if (w === "3day" || w === "7day") maxAge = 1800;
    else if (w === "15day" || w === "35day" || w === "70day" || w === "140day") maxAge = 3600;

    return jsonResponse({ data }, 200, maxAge);
  } catch (e) {
    console.error("D1 history query failed:", e);
    return jsonResponse({ data: [] }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Centralized routing table
    switch (url.pathname) {
      case "/ingest":
        if (request.method === "POST") return handleIngest(request, env);
        break;

      case "/latest":
        if (request.method === "GET") return handleLatest(env);
        break;

      case "/history":
        if (request.method === "GET") return handleHistory(url, env);
        break;

      case "/":
      case "/index.html":
        if (request.method === "GET") {
          return new Response(renderIndex(), { 
            headers: { 
              "Content-Type": "text/html",
              "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://rad.icmt.cc https://cloudflareinsights.com; img-src 'self' data: https://icmt.cc;"
            } 
          });
        }
        break;
    }

    return new Response("Not found", { status: 404 });
  },
};
