import Database from "better-sqlite3";

const db = new Database("data.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator'
);
CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    drone_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS telemetry (
    flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    ts INTEGER NOT NULL,
    lat REAL,
    lon REAL,
    alt REAL,
    battery REAL,
    speed REAL
);
CREATE INDEX IF NOT EXISTS idx_telemetry_flight_ts ON telemetry(flight_id, ts);
    `);

export default db;
