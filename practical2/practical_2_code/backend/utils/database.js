const Database = require('better-sqlite3');
const db = new Database('secure-rbac.db');

function initDb() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      surname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'MANAGER', 'USER', 'GUEST')),
      approved BOOLEAN DEFAULT 0,
      mfa_secret TEXT
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'MANAGER', 'USER', 'GUEST')),
      permission_id INTEGER NOT NULL,
      FOREIGN KEY (permission_id) REFERENCES permissions(id)
    );
  `);
}

initDb();