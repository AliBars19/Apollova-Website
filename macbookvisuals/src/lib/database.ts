// src/lib/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import { randomBytes } from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'licenses.db');

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create licenses table
  database.exec(`
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

  console.log('✓ License database initialized');
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

// Close database connection
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}