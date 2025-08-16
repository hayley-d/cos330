import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { Database as DBType } from "better-sqlite3";

const DB_FILE = path.resolve(__dirname, "./data/app.db");
const SCHEMA_FILE = path.resolve(__dirname, "./schema.sql");

export interface APPLICATION_DB {
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  run(
    sql: string,
    params?: any[],
  ): Promise<{ changes: number; lastID?: number } | void>;
}

export const db: DBType = new Database(DB_FILE);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function isInitialized(): boolean {
  const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users';"
  ).get();
  return !!row;
}

// export function migrate(): void {
//   if (!isInitialized()) {
//     console.log("Applying migrations......")
//     const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
//     db.exec(schema);
//   }
// }

export function migrate(): void {
  function isInitialized(): boolean {
    const row = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users';"
    ).get();
    return !!row;
  }

  if (isInitialized()) return;

  console.log("Applying migrations (verbose) …");

  let schema = fs.readFileSync(SCHEMA_FILE, "utf8");

  // Strip line comments to avoid splitting troubles
  schema = schema
      .split(/\r?\n/)
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n");

  // Split on semicolons that end a statement
  const statements = schema
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter(Boolean);

  db.exec("BEGIN");
  try {
    for (const sql of statements) {
      try {
        db.exec(sql);
      } catch (e) {
        console.error("\n--- MIGRATION FAILED ON STATEMENT ---\n");
        console.error(sql);
        console.error("\n------------------------------------\n");
        throw e;
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export const app_db: APPLICATION_DB = {
  get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return Promise.resolve(db.prepare(sql).get(params) as T | undefined);
  },
  all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return Promise.resolve(db.prepare(sql).all(params) as T[]);
  },
  run(
      sql: string,
      params: any[] = [],
  ): Promise<{ changes: number; lastID?: number }> {
    const result = db.prepare(sql).run(params);
    return Promise.resolve({ changes: result.changes, lastID: result.lastInsertRowid as number });
  },
};
