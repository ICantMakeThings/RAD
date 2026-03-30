-- Schema for RAD D1 database
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  clicks REAL NOT NULL
);

-- Index for faster time-range queries
CREATE INDEX IF NOT EXISTS idx_readings_ts ON readings(ts);
