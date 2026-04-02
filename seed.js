import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LATEST_URL = 'https://rad.icmt.cc/latest';
// Fetching the largest possible window (140 days)
const HISTORY_URL = 'https://rad.icmt.cc/history?window=140day';
const FINE_HISTORY_URL = 'https://rad.icmt.cc/history?window=1day';
const BATCH_SIZE = 500;
const DEFAULT_SEED_MODE = 'fixture';
const FIXTURE_PATH = path.join(process.cwd(), 'fixtures', 'seed-fixture.json');

async function fetchJsonOrThrow(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${url} -> HTTP ${response.status}`);
  }
  return response.json();
}

function buildSqlTuples(rows, intervalMins, cpmToUsv) {
  return rows
    .map((row) => {
      const ts = Number(row?.ts);
      const usv = Number(row?.usv);
      if (!Number.isFinite(ts) || !Number.isFinite(usv)) {
        return null;
      }

      const clicks = Math.max(0, Math.round((usv * intervalMins) / cpmToUsv));
      return `(${ts}, ${clicks})`;
    })
    .filter(Boolean);
}

function chunkRows(rows, size) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

function buildUpsertSqlScript(sqlTuples) {
  return chunkRows(sqlTuples, BATCH_SIZE)
    .map((chunk) => `INSERT OR REPLACE INTO readings (ts, clicks) VALUES ${chunk.join(', ')};`)
    .join('\n');
}

function parseSeedMode() {
  const fromArg = process.argv.find((arg) => arg.startsWith('--mode='));
  const mode = (fromArg ? fromArg.split('=')[1] : process.env.SEED_MODE || DEFAULT_SEED_MODE).toLowerCase();
  if (mode !== 'fixture' && mode !== 'live') {
    throw new Error(`Unsupported seed mode: ${mode}. Use fixture or live.`);
  }
  return mode;
}

function loadFixtureData() {
  if (!fs.existsSync(FIXTURE_PATH)) {
    throw new Error(`Fixture file not found: ${FIXTURE_PATH}`);
  }

  const raw = fs.readFileSync(FIXTURE_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed?.latest || !parsed?.history140?.data || !parsed?.history1day?.data) {
    throw new Error('Invalid fixture format. Expected latest, history140.data and history1day.data.');
  }

  return {
    latestData: { latest: parsed.latest },
    historyData: parsed.history140,
    fineHistoryData: parsed.history1day,
  };
}

async function loadLiveData() {
  const latestData = await fetchJsonOrThrow(LATEST_URL);
  const historyData = await fetchJsonOrThrow(HISTORY_URL);
  const fineHistoryData = await fetchJsonOrThrow(FINE_HISTORY_URL);

  return { latestData, historyData, fineHistoryData };
}

async function seed() {
  const mode = parseSeedMode();
  console.log('Reading config...');
  console.log(`Seed mode: ${mode}`);
  const intervalMs = 300000;
  const cpmToUsv = 0.0018;
  const intervalMins = intervalMs / 60000;

  console.log('Cleaning local storage...');
  try {
    execFileSync('npx', ['wrangler', 'd1', 'execute', 'RAD_D1', '--local', '--command=DELETE FROM readings;'], { stdio: 'inherit' });
    console.log('Local D1 "readings" table cleared.');
  } catch (e) {
    console.log('Notice: Could not clear D1 (might be empty or not initialized yet).');
  }

  const sourceLabel = mode === 'live' ? 'production' : 'fixture';
  console.log(`Loading seed data from ${sourceLabel} source...`);
  const { latestData, historyData, fineHistoryData } = mode === 'live'
    ? await loadLiveData()
    : loadFixtureData();

  if (latestData.latest) {
    console.log('Seeding KV "latest" key...');
    const kvValue = JSON.stringify(latestData.latest);
    execFileSync('npx', ['wrangler', 'kv', 'key', 'put', 'latest', kvValue, '--binding', 'RAD_KV', '--local'], { stdio: 'inherit' });
  }

  console.log('Applying historical seed set...');

  if (historyData.data && historyData.data.length > 0) {
    console.log(`Preparing to seed D1 with ${historyData.data.length} historical records...`);

    const sqlTuples = buildSqlTuples(historyData.data, intervalMins, cpmToUsv);
    if (sqlTuples.length === 0) {
      throw new Error('No valid historical rows to seed.');
    }

    const sqlScript = buildUpsertSqlScript(sqlTuples);
    const tempSqlPath = path.join(process.cwd(), 'temp_seed.sql');
    fs.writeFileSync(tempSqlPath, sqlScript);

    try {
      console.log('Executing D1 seed script...');
      execFileSync('npx', ['wrangler', 'd1', 'execute', 'RAD_D1', '--local', '--file', tempSqlPath], { stdio: 'inherit' });
      console.log('Historical seeding complete!');
    } finally {
      if (fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);
    }
  }

  // Apply fine-grained data set for short-window chart behavior
  console.log('Applying fine-grained seed set...');

  if (fineHistoryData.data && fineHistoryData.data.length > 0) {
    console.log(`Seeding D1 with ${fineHistoryData.data.length} fine-grained records...`);
    const sqlTuples = buildSqlTuples(fineHistoryData.data, intervalMins, cpmToUsv);
    if (sqlTuples.length === 0) {
      throw new Error('No valid fine-grained rows to seed.');
    }

    const sqlScript = buildUpsertSqlScript(sqlTuples);
    const tempSqlPath = path.join(process.cwd(), 'temp_fine_seed.sql');
    fs.writeFileSync(tempSqlPath, sqlScript);

    try {
      execFileSync('npx', ['wrangler', 'd1', 'execute', 'RAD_D1', '--local', '--file', tempSqlPath], { stdio: 'inherit' });
      console.log('Fine-grained seeding complete!');
    } finally {
      if (fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);
    }
  }

  console.log('All seeding operations complete successfully!');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
