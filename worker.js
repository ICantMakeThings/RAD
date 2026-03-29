import { renderIndex } from "./template.js";

const HOUR = 3_600_000;
const DAY = 86_400_000;
const OFFLINE_THRESHOLD_MS = 10 * 60_000;

const jsonResponse = (data, status = 200, cacheDirective = "public, max-age=60") => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheDirective,
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
    const since = Date.now() - HOUR;
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
  const offline = diffMs > OFFLINE_THRESHOLD_MS;

  return jsonResponse({
    latest,
    cpm: cpm_from_latest,
    instant_usv,
    avg_usv,
    unit: "µSv/h",
    offline,
    lastSeenAgo: diffMs,
  }, 200, "no-store");
}

async function handleHistory(url, env) {
  const w = url.searchParams.get("window") || "1hr";
  const windows = {
    "1hr": HOUR,
    "12hr": 12 * HOUR,
    "1day": DAY,
    "3day": 3 * DAY,
    "7day": 7 * DAY,
    "15day": 15 * DAY,
    "35day": 35 * DAY,
    "70day": 70 * DAY,
    "140day": 140 * DAY,
  };
  const buckets = {
    "12hr": 10 * 60_000,
    "1day": 30 * 60_000,
    "3day": HOUR,
    "7day": 2 * HOUR,
    "15day": 4 * HOUR,
    "35day": 8 * HOUR,
    "70day": 16 * HOUR,
    "140day": DAY,
  };
  const cacheMaxAge = {
    "12hr": 300, "1day": 300,
    "3day": 1800, "7day": 1800,
    "15day": 3600, "35day": 3600, "70day": 3600, "140day": 3600,
  };
  const ms = windows[w] || windows["1hr"];
  const since = Date.now() - ms;
  const bucketMs = buckets[w] || 0;

  try {
    let rows;
    if (bucketMs > 0) {
      rows = await env.RAD_D1.prepare(
        "SELECT (ts - ts % ?) as ts, AVG(clicks) as clicks FROM readings WHERE ts >= ? GROUP BY (ts - ts % ?) ORDER BY ts ASC;"
      ).bind(bucketMs, since, bucketMs).all();
    } else {
      rows = await env.RAD_D1.prepare(
        "SELECT ts, clicks FROM readings WHERE ts >= ? ORDER BY ts ASC;"
      ).bind(since).all();
    }

    const cfg = getConfig(env);
    const data = rows.results.map(r => ({
      ts: r.ts,
      usv: (r.clicks / (cfg.intervalMs / 60000)) * cfg.cpmToUsv,
    }));

    const maxAge = cacheMaxAge[w] || 60;
    const swr = maxAge >= 3600 ? ", stale-while-revalidate=86400" : ", stale-while-revalidate=600";

    return jsonResponse({ data }, 200, `public, max-age=${maxAge}${swr}`);
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
              "Content-Type": "text/html; charset=UTF-8",
              "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
              "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://rad.icmt.cc https://cloudflareinsights.com; img-src 'self' data: https://icmt.cc;"
            }
          });
        }
        break;
    }

    return new Response("Not found", { status: 404 });
  },
};
