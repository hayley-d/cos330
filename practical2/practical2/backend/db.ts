import fs from "fs";
import Database from "better-sqlite3";
import type { Database as DBType } from "better-sqlite3";

// Create the DB connection
export const my_database : DBType = new Database("app.db");
my_database.pragma("journal_mode = WAL");

// Run the schema migrations from schema.sql
export function migrate(): void {
    const sql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
    my_database.exec(sql);
}
