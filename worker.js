import { renderIndex } from "./template.js";

const jsonResponse = (data, status = 200, maxAge = 60) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": maxAge > 0 ? `public, max-age=${maxAge}` : "no-store"
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
    cpm: cpmValue,
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
    "10hr": 10 * 3600e3,
    "10day": 10 * 86400e3,
    "50day": 50 * 86400e3,
    "180day": 180 * 86400e3,
    "1year": 365 * 86400e3,
  };
  const ms = windows[w] || windows["1hr"];
  const since = Date.now() - ms;

  let bucketMs = 0;
  if (w === "10day") bucketMs = 3600e3;
  else if (w === "50day") bucketMs = 4 * 3600e3;
  else if (w === "180day") bucketMs = 12 * 3600e3;
  else if (w === "1year") bucketMs = 24 * 3600e3;

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
    if (w === "10hr") maxAge = 300; // 5 mins
    else if (w === "10day") maxAge = 1800; // 30 mins
    else if (w === "50day" || w === "180day" || w === "1year") maxAge = 3600; // 1 hour cache explicitly for long datasets

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
          return new Response(renderIndex(), { headers: { "Content-Type": "text/html" } });
        }
        break;
    }

    return new Response("Not found", { status: 404 });
  },
};
