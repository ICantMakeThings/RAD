import { renderIndex } from "./template.js";

const SECONDS_IN_MINUTE = 60;
const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = 60 * MS_IN_SECOND;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;
const MS_IN_DAY = MS_IN_HOUR * 24;
const OFFLINE_THRESHOLD_MS = 10 * MS_IN_MINUTE;
const RECENT_CLICKS_KEY = "recent_clicks";
const RECENT_HORIZON_MS = 2 * MS_IN_HOUR;

const jsonResponse = (data, status = 200, cacheDirective = "public, max-age=120, stale-if-error=86400, stale-while-revalidate=86400") => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheDirective,
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const DEFAULT_INTERVAL_MS = 300000;
const DEFAULT_CPM_TO_USV = 0.0018;

const getConfig = (env) => {
  const intervalMs = Number(env.POST_INTERVAL_MS);
  const cpmToUsv = Number(env.CPM_TO_USV);

  return {
    intervalMs: Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : DEFAULT_INTERVAL_MS,
    cpmToUsv: Number.isFinite(cpmToUsv) && cpmToUsv > 0 ? cpmToUsv : DEFAULT_CPM_TO_USV
  };
};

const clicksToUsv = (clicks, intervalMs, cpmToUsv) => {
  const cpm = Number(clicks) / (intervalMs / 60000);
  return cpm * cpmToUsv;
};

const methodNotAllowed = (allowed) => {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      "Allow": allowed
    }
  });
};

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

  const clicks = Number(body?.clicks);
  if (!Number.isFinite(clicks) || clicks < 0 || !Number.isInteger(clicks)) {
    return new Response("Invalid clicks value", { status: 400 });
  }

  const now = Date.now();

  await env.RAD_KV.put("latest", JSON.stringify({ clicks, ts: now, receivedAt: now }));

  // Keep a rolling in-KV window so /latest can avoid expensive D1 scans.
  try {
    const recentRaw = await env.RAD_KV.get(RECENT_CLICKS_KEY);
    let recent = [];
    if (recentRaw) {
      try {
        const parsed = JSON.parse(recentRaw);
        if (Array.isArray(parsed)) {
          recent = parsed;
        }
      } catch {
        recent = [];
      }
    }

    recent.push({ ts: now, clicks });
    const minTs = now - RECENT_HORIZON_MS;
    recent = recent.filter((r) => Number.isFinite(r?.ts) && Number.isFinite(r?.clicks) && r.ts >= minTs);
    await env.RAD_KV.put(RECENT_CLICKS_KEY, JSON.stringify(recent));
  } catch (e) {
    console.error("Failed to update rolling recent clicks in KV:", e);
  }

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
  let latest = null;
  if (latestRaw) {
    try {
      latest = JSON.parse(latestRaw);
    } catch (e) {
      console.error("Failed to parse latest KV payload:", e);
      latest = null;
    }
  }

  const now = Date.now();
  const since = now - MS_IN_HOUR;
  let totalClicks = 0;

  try {
    const recentRaw = await env.RAD_KV.get(RECENT_CLICKS_KEY);
    if (recentRaw) {
      const recent = JSON.parse(recentRaw);
      if (Array.isArray(recent)) {
        totalClicks = recent
          .filter((r) => Number.isFinite(r?.ts) && Number.isFinite(r?.clicks) && r.ts >= since)
          .reduce((sum, r) => sum + Number(r.clicks), 0);
      }
    }
  } catch (e) {
    console.error("KV hourly aggregate read failed:", e);
  }

  if (!Number.isFinite(totalClicks) || totalClicks <= 0) {
    try {
      const query = await env.RAD_D1.prepare(
        "SELECT SUM(clicks) AS s FROM readings WHERE ts >= ?;"
      ).bind(since).all();
      totalClicks = query.results?.[0]?.s || 0;
    } catch (e) {
      console.error("D1 hourly aggregate query failed:", e);
      return jsonResponse({ error: "Database query failed", details: e.message }, 500, "no-store");
    }
  }

  const cfg = getConfig(env);
  const cpmValue = totalClicks / 60;
  const avg_usv = cpmValue * cfg.cpmToUsv;

  const cpm_from_latest = latest ? latest.clicks / (cfg.intervalMs / 60000) : 0;
  const instant_usv = cpm_from_latest * cfg.cpmToUsv;

  const lastUpdate = latest?.receivedAt || 0;
  const diffMs = now - lastUpdate;
  const offline = diffMs > OFFLINE_THRESHOLD_MS;

  return jsonResponse({
    latest,
    cpm: Math.round(cpm_from_latest),
    instant_usv,
    avg_usv,
    unit: "µSv/h",
    offline,
    lastSeenAgo: diffMs,
  }, 200, "no-store");
}

async function handleExport(env) {
  try {
    const cfg = getConfig(env);
    const pageSize = 1000;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode("timestamp,iso_time,clicks,usv\n"));

          let offset = 0;
          while (true) {
            const page = await env.RAD_D1.prepare(
              "SELECT ts, clicks FROM readings ORDER BY ts ASC LIMIT ? OFFSET ?;"
            ).bind(pageSize, offset).all();

            const rows = page.results || [];
            if (rows.length === 0) {
              break;
            }

            let chunk = "";
            for (const r of rows) {
              const usv = clicksToUsv(r.clicks, cfg.intervalMs, cfg.cpmToUsv);
              const iso = new Date(r.ts).toISOString();
              chunk += `${r.ts},${iso},${r.clicks},${usv}\n`;
            }

            controller.enqueue(encoder.encode(chunk));
            offset += rows.length;

            if (rows.length < pageSize) {
              break;
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="radiation_data.csv"`,
        "Cache-Control": "no-store"
      },
    });

  } catch (e) {
    console.error("Export failed:", e);
    return new Response("Export failed", { status: 500 });
  }
}

async function handleHistory(request, url, env, ctx) {
  const w = url.searchParams.get("window") || "1hr";

  const windows = {
    "1hr": MS_IN_HOUR,
    "12hr": 12 * MS_IN_HOUR,
    "1day": MS_IN_DAY,
    "3day": 3 * MS_IN_DAY,
    "7day": 7 * MS_IN_DAY,
    "15day": 15 * MS_IN_DAY,
    "35day": 35 * MS_IN_DAY,
    "70day": 70 * MS_IN_DAY,
    "140day": 140 * MS_IN_DAY,
  };

  const buckets = {
    "12hr": 10 * MS_IN_MINUTE,
    "1day": 30 * MS_IN_MINUTE,
    "3day": MS_IN_HOUR,
    "7day": 2 * MS_IN_HOUR,
    "15day": 4 * MS_IN_HOUR,
    "35day": 8 * MS_IN_HOUR,
    "70day": 16 * MS_IN_HOUR,
    "140day": MS_IN_DAY,
  };

  const cacheMaxAge = {
    "12hr": 10 * SECONDS_IN_MINUTE,
    "1day": 30 * SECONDS_IN_MINUTE,
    "3day": 60 * SECONDS_IN_MINUTE,
    "7day": 120 * SECONDS_IN_MINUTE,
    "15day": 180 * SECONDS_IN_MINUTE,
    "35day": 300 * SECONDS_IN_MINUTE,
    "70day": 600 * SECONDS_IN_MINUTE,
    "140day": 1200 * SECONDS_IN_MINUTE,
  };

  const ms = windows[w] || windows["1hr"];
  if (!windows[w]) {
    return jsonResponse({ error: "Invalid window" }, 400, "no-store");
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

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
      usv: clicksToUsv(r.clicks, cfg.intervalMs, cfg.cpmToUsv),
    }));

    const maxAge = cacheMaxAge[w] || 10 * SECONDS_IN_MINUTE;

    const response = jsonResponse({ data }, 200, `public, max-age=${maxAge}, stale-if-error=86400, stale-while-revalidate=86400`);
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (e) {
    console.error("D1 history query failed:", e);
    return jsonResponse({ data: [] }, 500);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Centralized routing table
    switch (url.pathname) {
      case "/ingest":
        if (request.method === "POST") return handleIngest(request, env);
        return methodNotAllowed("POST");
        break;

      case "/latest":
        if (request.method === "GET") return handleLatest(env);
        return methodNotAllowed("GET");
        break;

      case "/export":
        if (request.method === "GET") return handleExport(env);
        return methodNotAllowed("GET");
        break;

      case "/history":
        if (request.method === "GET") return handleHistory(request, url, env, ctx);
        return methodNotAllowed("GET");
        break;

      case "/":
      case "/index.html":
        if (request.method === "GET") {
          return new Response(renderIndex(), {
            headers: {
              "Content-Type": "text/html; charset=UTF-8",
              "Cache-Control": "public, max-age=600, stale-if-error=86400, stale-while-revalidate=86400",
              "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://rad.icmt.cc https://*.cloudflareinsights.com; img-src 'self' data: https://icmt.cc;"
            }
          });
        }
        break;
    }

    return new Response("Not found", { status: 404 });
  },
};
