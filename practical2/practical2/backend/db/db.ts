import fs from "fs";
import Database from "better-sqlite3";
import type { Database as DBType } from "better-sqlite3";

export interface DB {
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  run(
    sql: string,
    params?: any[],
  ): Promise<{ changes: number; lastID?: number } | void>;
}

// Create the DB connection
export const my_database: DBType = new Database("app.db");
my_database.pragma("journal_mode = WAL");

// Run the schema migrations from schema.sql
export function migrate(): void {
  const sql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  my_database.exec(sql);
}
