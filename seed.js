import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LATEST_URL = 'https://rad.icmt.cc/latest';
// Fetching the largest possible window (140 days)
const HISTORY_URL = 'https://rad.icmt.cc/history?window=140day';

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

async function seed() {
  console.log('Reading config...');
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

  console.log('Fetching latest data from production...');
  const latestData = await fetchJsonOrThrow(LATEST_URL);

  if (latestData.latest) {
    console.log('Seeding KV "latest" key...');
    const kvValue = JSON.stringify(latestData.latest);
    execFileSync('npx', ['wrangler', 'kv', 'key', 'put', 'latest', kvValue, '--binding', 'RAD_KV', '--local'], { stdio: 'inherit' });
  }

  console.log('Fetching maximum historical data from production (140 days)...');
  const historyData = await fetchJsonOrThrow(HISTORY_URL);

  if (historyData.data && historyData.data.length > 0) {
    console.log(`Preparing to seed D1 with ${historyData.data.length} historical records...`);

    const sqlValues = buildSqlTuples(historyData.data, intervalMins, cpmToUsv).join(', ');
    if (!sqlValues) {
      throw new Error('No valid historical rows to seed.');
    }

    const sqlScript = `INSERT OR REPLACE INTO readings (ts, clicks) VALUES ${sqlValues};`;
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

  // Also fetch the last 24h for fine-grained data (no buckets)
  console.log('Fetching fine-grained data for the last 24h...');
  const fineHistoryData = await fetchJsonOrThrow('https://rad.icmt.cc/history?window=1day');

  if (fineHistoryData.data && fineHistoryData.data.length > 0) {
    console.log(`Seeding D1 with ${fineHistoryData.data.length} fine-grained records...`);
    const sqlValues = buildSqlTuples(fineHistoryData.data, intervalMins, cpmToUsv).join(', ');
    if (!sqlValues) {
      throw new Error('No valid fine-grained rows to seed.');
    }

    const sqlScript = `INSERT OR REPLACE INTO readings (ts, clicks) VALUES ${sqlValues};`;
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
