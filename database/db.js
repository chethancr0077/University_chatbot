const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

const SOURCE_DB_PATH = path.join(__dirname, 'unimate.db');
const DB_PATH = process.env.SQLITE_DB_PATH || (process.env.VERCEL
  ? path.join(os.tmpdir(), 'unimate-ai', 'unimate.db')
  : SOURCE_DB_PATH);
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    if (DB_PATH !== SOURCE_DB_PATH && !fs.existsSync(DB_PATH)) {
      if (!fs.existsSync(SOURCE_DB_PATH)) {
        throw new Error(`Seed database not found at ${SOURCE_DB_PATH}`);
      }
      fs.copyFileSync(SOURCE_DB_PATH, DB_PATH);
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
      } else {
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON;');
      }
    });
  }
  return db;
}

// Promisified DB helpers
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbExec(sql) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function initSchema() {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await dbExec(schemaSql);
  console.log('✅ SQLite Schema initialized successfully.');
}

module.exports = {
  getDb,
  dbGet,
  dbAll,
  dbRun,
  dbExec,
  initSchema,
  DB_PATH
};
