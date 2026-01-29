// src/lib/database.ts
// Using sql.js (pure JavaScript SQLite - no native compilation needed)
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'licenses.db');

let db: SqlJsDatabase | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!db) {
    // Initialize SQL.js
    if (!SQL) {
      SQL = await initSqlJs();
    }
    
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log('✓ Created data directory');
    }
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
    
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: SqlJsDatabase) {
  // Create licenses table
  database.run(`
    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      license_key TEXT UNIQUE NOT NULL,
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      price_paid REAL NOT NULL,
      activated INTEGER DEFAULT 0,
      activation_date TEXT,
      hw_fingerprint TEXT,
      last_verified TEXT,
      revoked INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Create index for faster lookups
  database.run(`
    CREATE INDEX IF NOT EXISTS idx_license_key ON licenses(license_key);
  `);

  // Save to disk
  saveDatabase();
  
  console.log('✓ License database initialized');
}

export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

export function generateLicenseKey(): string {
  const segments = 4;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < 4; j++) {
      const randomIndex = randomBytes(1)[0] % chars.length;
      key += chars[randomIndex];
    }
    if (i < segments - 1) key += '-';
  }
  
  return key;
}

export function generateId(): string {
  return randomBytes(16).toString('hex');
}

export function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('✓ Database connection closed');
  }
}