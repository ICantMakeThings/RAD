import { spawn } from 'child_process';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:8787';
const STARTUP_TIMEOUT_MS = 45000;
const POLL_MS = 500;

function log(msg) {
  process.stdout.write(`[e2e] ${msg}\n`);
}

function fail(msg) {
  throw new Error(msg);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return;
    } catch {
      // Keep polling.
    }
    await sleep(POLL_MS);
  }
  fail(`Server did not start within ${timeoutMs}ms`);
}

async function getJson(path, expectedStatus = 200) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (res.status !== expectedStatus) {
    fail(`${path} expected HTTP ${expectedStatus}, got ${res.status}`);
  }
  return res.json();
}

async function run() {
  log('Starting local wrangler dev server...');
  const server = spawn('npx', ['wrangler', 'dev', '--local', '--port', '8787'], {
    stdio: 'ignore',
    detached: true,
    env: process.env,
  });
  server.unref();

  const waitForExit = () => new Promise((resolve) => {
    server.once('close', () => resolve());
  });

  const shutdown = async () => {
    if (server.killed) return;
    try {
      process.kill(-server.pid, 'SIGKILL');
    } catch {
      // Ignore if process already exited.
    }
    await Promise.race([
      waitForExit(),
      sleep(2000),
    ]);
  };

  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(1);
  });

  try {
    await waitForServer(`${BASE_URL}/`, STARTUP_TIMEOUT_MS);
    log('Server ready, running endpoint checks...');

    const homeRes = await fetch(`${BASE_URL}/`, { cache: 'no-store' });
    if (homeRes.status !== 200) fail(`/ expected HTTP 200, got ${homeRes.status}`);
    const homeHtml = await homeRes.text();

    const requiredFrontendMarkers = [
      'id="instant"',
      'id="avg"',
      'id="cpm"',
      'id="radiationIcon"',
      'id="chart"',
      'class="status-legend"',
      'data:image/svg+xml',
      '☢',
    ];
    for (const marker of requiredFrontendMarkers) {
      if (!homeHtml.includes(marker)) {
        fail(`Frontend marker missing in / HTML: ${marker}`);
      }
    }

    const latestBefore = await getJson('/latest', 200);
    if (!Number.isFinite(Number(latestBefore.instant_usv))) fail('/latest instant_usv is not numeric');
    if (!Number.isFinite(Number(latestBefore.avg_usv))) fail('/latest avg_usv is not numeric');
    if (!Number.isFinite(Number(latestBefore.cpm))) fail('/latest cpm is not numeric');

    const history = await getJson('/history?window=1hr', 200);
    if (!Array.isArray(history.data)) fail('/history data must be an array');

    await getJson('/history?window=invalid', 400);

    const ingestGet = await fetch(`${BASE_URL}/ingest`);
    if (ingestGet.status !== 405) fail(`/ingest GET expected 405, got ${ingestGet.status}`);

    const ingestUnauthorized = await fetch(`${BASE_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clicks: 1000 }),
    });
    if (ingestUnauthorized.status !== 401) fail(`/ingest POST without token expected 401, got ${ingestUnauthorized.status}`);

    const ingestAuthorized = await fetch(`${BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer local-dev-token',
      },
      body: JSON.stringify({ clicks: 1337 }),
    });
    if (ingestAuthorized.status !== 200) fail(`/ingest POST with token expected 200, got ${ingestAuthorized.status}`);

    const latestAfter = await getJson('/latest', 200);
    if (Number(latestAfter?.latest?.clicks) !== 1337) {
      fail(`/latest did not reflect ingested clicks; expected 1337, got ${latestAfter?.latest?.clicks}`);
    }

    const exportRes = await fetch(`${BASE_URL}/export`);
    if (exportRes.status !== 200) fail(`/export expected HTTP 200, got ${exportRes.status}`);
    const csv = await exportRes.text();
    if (!csv.startsWith('timestamp,iso_time,clicks,usv')) {
      fail('/export CSV header mismatch');
    }

    log('All endpoint and frontend smoke checks passed.');
  } finally {
    await shutdown();
  }
}

run().catch((err) => {
  process.stderr.write(`[e2e] FAILED: ${err.message}\n`);
  process.exit(1);
});
