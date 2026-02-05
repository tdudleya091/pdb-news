import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DATABASE_PATH || "./data/pdb.db";

// Ensure the directory exists
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS briefs (
    id TEXT PRIMARY KEY,
    date INTEGER NOT NULL,
    weather TEXT NOT NULL,
    executive_summary TEXT NOT NULL,
    sections TEXT NOT NULL,
    raw_news TEXT,
    generated_at INTEGER NOT NULL,
    delivered_via TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS delivery_logs (
    id TEXT PRIMARY KEY,
    brief_id TEXT REFERENCES briefs(id),
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at INTEGER NOT NULL,
    error TEXT
  );
`);
