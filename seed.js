import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LATEST_URL = 'https://rad.icmt.cc/latest';
// Fetching the largest possible window (140 days)
const HISTORY_URL = 'https://rad.icmt.cc/history?window=140day';

async function seed() {
  console.log('Reading config...');
  const intervalMs = 300000;
  const cpmToUsv = 0.0018;
  const intervalMins = intervalMs / 60000;

  console.log('Cleaning local storage...');
  try {
    execFileSync('npx', ['wrangler', 'd1', 'execute', 'RAD_D1', '--local', '--command="DELETE FROM readings;"'], { stdio: 'inherit' });
    console.log('Local D1 "readings" table cleared.');
  } catch (e) {
    console.log('Notice: Could not clear D1 (might be empty or not initialized yet).');
  }

  console.log('Fetching latest data from production...');
  const latestResponse = await fetch(LATEST_URL);
  const latestData = await latestResponse.json();

  if (latestData.latest) {
    console.log('Seeding KV "latest" key...');
    const kvValue = JSON.stringify(latestData.latest);
    execFileSync('npx', ['wrangler', 'kv', 'key', 'put', 'latest', kvValue, '--binding', 'RAD_KV', '--local'], { stdio: 'inherit' });
  }

  console.log('Fetching maximum historical data from production (140 days)...');
  const historyResponse = await fetch(HISTORY_URL);
  const historyData = await historyResponse.json();

  if (historyData.data && historyData.data.length > 0) {
    console.log(`Preparing to seed D1 with ${historyData.data.length} historical records...`);

    // Invert formula: clicks = (usv * intervalMins) / cpmToUsv
    const sqlValues = historyData.data.map(row => {
      const clicks = (row.usv * intervalMins) / cpmToUsv;
      return `(${row.ts}, ${clicks})`;
    }).join(', ');

    const sqlScript = `INSERT INTO readings (ts, clicks) VALUES ${sqlValues};`;
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
  const fineHistoryResponse = await fetch('https://rad.icmt.cc/history?window=1day');
  const fineHistoryData = await fineHistoryResponse.json();

  if (fineHistoryData.data && fineHistoryData.data.length > 0) {
    console.log(`Seeding D1 with ${fineHistoryData.data.length} fine-grained records...`);
    const sqlValues = fineHistoryData.data.map(row => {
      const clicks = (row.usv * intervalMins) / cpmToUsv;
      return `(${row.ts}, ${clicks})`;
    }).join(', ');

    // Use INSERT OR IGNORE to avoid duplicates if timestamps overlap
    const sqlScript = `INSERT OR IGNORE INTO readings (ts, clicks) VALUES ${sqlValues};`;
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
