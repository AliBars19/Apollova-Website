import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'licenses.db');

let db: SqlJsDatabase | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  // Initialize SQL.js with explicit WASM path for production
  if (!SQL) {
    const wasmPaths = [
      path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
      path.join(process.cwd(), 'public', 'sql-wasm.wasm'),
    ];

    let wasmBinary: ArrayBuffer | undefined;
    
    for (const wasmPath of wasmPaths) {
      try {
        if (fs.existsSync(wasmPath)) {
          const fileBuffer = fs.readFileSync(wasmPath);
          // Convert Node.js Buffer to ArrayBuffer
          wasmBinary = fileBuffer.buffer.slice(
            fileBuffer.byteOffset,
            fileBuffer.byteOffset + fileBuffer.byteLength
          );
          console.log('Found WASM at:', wasmPath);
          break;
        }
      } catch (e) {
        // Continue to next path
      }
    }

    if (wasmBinary) {
      SQL = await initSqlJs({ wasmBinary });
    } else {
      console.warn('WASM file not found locally, using default initialization');
      SQL = await initSqlJs();
    }
  }

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if they don't exist
  db.run(`
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
      notes TEXT DEFAULT ''
    )
  `);

  saveDatabase();

  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}