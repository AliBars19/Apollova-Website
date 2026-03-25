// src/lib/__tests__/database.integration.test.ts
// Expands coverage for database.ts beyond the existing database.test.ts.
// Tests: getDatabase() singleton, loading from existing DB file,
// saveDatabase() write, table DDL, and re-initialization reset.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { generateLicenseKey, generateId } from '../database';

// ---------------------------------------------------------------------------
// MockDatabase must be available when vi.mock() runs (it is hoisted to the
// top of the file). We use vi.hoisted() so the class is declared before the
// hoisted mock factory executes.
// ---------------------------------------------------------------------------

const { MockDatabase } = vi.hoisted(() => {
  class MockDatabase {
    private ddlLog: string[] = [];
    private _exported = false;

    run(sql: string): void {
      this.ddlLog.push(sql);
    }

    exec(_sql: string): unknown[] {
      return [];
    }

    export(): Uint8Array {
      this._exported = true;
      return new Uint8Array([83, 81, 76, 105, 116, 101]); // "SQLite"
    }

    getDdlLog(): string[] {
      return [...this.ddlLog];
    }

    wasExported(): boolean {
      return this._exported;
    }
  }

  return { MockDatabase };
});

// Static mock factory — references only MockDatabase which is available via vi.hoisted()
vi.mock('sql.js', () => ({
  default: vi.fn().mockResolvedValue({
    Database: MockDatabase,
  }),
}));

// ---------------------------------------------------------------------------
// Helper: access the mocked initSqlJs spy
// ---------------------------------------------------------------------------
async function getInitSqlJsSpy() {
  const sqlModule = await import('sql.js');
  return sqlModule.default as ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// getDatabase tests
// ---------------------------------------------------------------------------

describe('getDatabase', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-test-'));
    fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
    origCwd = process.cwd();
    process.chdir(tmpDir);
    vi.resetModules();
  });

  afterEach(() => {
    process.chdir(origCwd);
    vi.resetModules();
  });

  it('returns the same instance on multiple calls (singleton)', async () => {
    const { getDatabase } = await import('../database');
    const db1 = await getDatabase();
    const db2 = await getDatabase();
    expect(db1).toBe(db2);
  });

  it('creates a new database when no existing DB file is present', async () => {
    const { getDatabase } = await import('../database');
    const db = await getDatabase();
    expect(db).toBeDefined();
    // saveDatabase() is called inside getDatabase(), so the file should exist
    const dbPath = path.join(tmpDir, 'data', 'licenses.db');
    expect(fs.existsSync(dbPath)).toBe(true);
  });

  it('calls CREATE TABLE IF NOT EXISTS licenses', async () => {
    const { getDatabase } = await import('../database');
    const db = await getDatabase();
    const ddl = (db as unknown as InstanceType<typeof MockDatabase>).getDdlLog();
    const createStatement = ddl.find((s) => s.includes('CREATE TABLE IF NOT EXISTS licenses'));
    expect(createStatement).toBeDefined();
  });

  it('licenses DDL includes all expected columns', async () => {
    const { getDatabase } = await import('../database');
    const db = await getDatabase();
    const ddl = (db as unknown as InstanceType<typeof MockDatabase>).getDdlLog().join('\n');
    expect(ddl).toContain('id TEXT PRIMARY KEY');
    expect(ddl).toContain('license_key TEXT UNIQUE NOT NULL');
    expect(ddl).toContain('customer_email TEXT NOT NULL');
    expect(ddl).toContain('customer_name TEXT NOT NULL');
    expect(ddl).toContain('purchase_date TEXT NOT NULL');
    expect(ddl).toContain('price_paid REAL NOT NULL');
    expect(ddl).toContain('activated INTEGER DEFAULT 0');
    expect(ddl).toContain('activation_date TEXT');
    expect(ddl).toContain('hw_fingerprint TEXT');
    expect(ddl).toContain('last_verified TEXT');
    expect(ddl).toContain('revoked INTEGER DEFAULT 0');
    expect(ddl).toContain('notes TEXT DEFAULT');
  });

  it('loads data from an existing DB file', async () => {
    // Write a fake DB file so fs.existsSync returns true for it
    const dbPath = path.join(tmpDir, 'data', 'licenses.db');
    const fakeDbBytes = Buffer.from([83, 81, 76, 105, 116, 101]); // "SQLite"
    fs.writeFileSync(dbPath, fakeDbBytes);

    const { getDatabase } = await import('../database');
    const db = await getDatabase();
    expect(db).toBeDefined();
  });

  it('creates the data directory if it does not exist', async () => {
    // Remove the data dir so database.ts has to create it
    fs.rmdirSync(path.join(tmpDir, 'data'));

    const { getDatabase } = await import('../database');
    await getDatabase();

    expect(fs.existsSync(path.join(tmpDir, 'data'))).toBe(true);
  });

  it('calls initSqlJs with wasmBinary when node_modules WASM file exists', async () => {
    // Create a fake WASM file at the expected node_modules path
    const wasmDir = path.join(tmpDir, 'node_modules', 'sql.js', 'dist');
    fs.mkdirSync(wasmDir, { recursive: true });
    fs.writeFileSync(path.join(wasmDir, 'sql-wasm.wasm'), Buffer.from([0x00, 0x61, 0x73, 0x6d]));

    const { getDatabase } = await import('../database');
    await getDatabase();

    const initSqlJs = await getInitSqlJsSpy();
    expect(initSqlJs).toHaveBeenCalledWith(
      expect.objectContaining({ wasmBinary: expect.anything() })
    );
  });
});

// ---------------------------------------------------------------------------
// saveDatabase tests
// ---------------------------------------------------------------------------

describe('saveDatabase', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbsave-'));
    fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
    origCwd = process.cwd();
    process.chdir(tmpDir);
    vi.resetModules();
  });

  afterEach(() => {
    process.chdir(origCwd);
    vi.resetModules();
  });

  it('writes DB bytes to disk after getDatabase()', async () => {
    const { getDatabase } = await import('../database');
    await getDatabase();

    const dbPath = path.join(tmpDir, 'data', 'licenses.db');
    expect(fs.existsSync(dbPath)).toBe(true);

    const fileContents = fs.readFileSync(dbPath);
    // Our MockDatabase.export() returns "SQLite" bytes
    expect(fileContents.toString()).toBe('SQLite');
  });

  it('saveDatabase() is a no-op when db is null (module freshly imported, not initialized)', async () => {
    // Import without calling getDatabase() — db is null in module
    const { saveDatabase } = await import('../database');
    expect(() => saveDatabase()).not.toThrow();
  });

  it('calls db.export() during saveDatabase()', async () => {
    const { getDatabase, saveDatabase } = await import('../database');
    const db = await getDatabase();

    // Call saveDatabase again after init
    saveDatabase();

    expect((db as unknown as InstanceType<typeof MockDatabase>).wasExported()).toBe(true);
  });

  it('creates the data directory if needed during saveDatabase()', async () => {
    const { getDatabase, saveDatabase } = await import('../database');
    await getDatabase();

    // Remove the data dir after successful init
    const dataDir = path.join(tmpDir, 'data');
    fs.rmSync(dataDir, { recursive: true });

    // saveDatabase should recreate it
    expect(() => saveDatabase()).not.toThrow();
    expect(fs.existsSync(dataDir)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generateLicenseKey — additional edge cases (supplement existing tests)
// These are pure functions, no sql.js dependency.
// ---------------------------------------------------------------------------

describe('generateLicenseKey — additional edge cases', () => {
  it('never uses excluded characters (I, O, 0, 1)', () => {
    const excluded = new Set(['I', 'O', '0', '1']);
    for (let i = 0; i < 100; i++) {
      const key = generateLicenseKey();
      for (const ch of key.replace(/-/g, '')) {
        expect(excluded.has(ch)).toBe(false);
      }
    }
  });

  it('total character count is 19 (4+1+4+1+4+1+4)', () => {
    expect(generateLicenseKey()).toHaveLength(19);
  });
});

// ---------------------------------------------------------------------------
// generateId — additional edge cases
// ---------------------------------------------------------------------------

describe('generateId — additional edge cases', () => {
  it('never produces an empty string', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateId().length).toBeGreaterThan(0);
    }
  });

  it('produces IDs of at least 14 characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateId().length).toBeGreaterThanOrEqual(14);
    }
  });
});
