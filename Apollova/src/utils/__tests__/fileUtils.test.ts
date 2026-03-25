import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { readJsonFile, withLockedJsonFile } from '../fileUtils';

describe('readJsonFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fileutils-'));
  });

  it('reads valid JSON file', async () => {
    const filePath = path.join(tmpDir, 'data.json');
    await fs.writeFile(filePath, JSON.stringify({ key: 'value' }));
    const result = await readJsonFile<{ key: string }>(filePath, { key: 'default' });
    expect(result.key).toBe('value');
  });

  it('returns fallback for missing file', async () => {
    const result = await readJsonFile(path.join(tmpDir, 'missing.json'), { x: 42 });
    expect(result.x).toBe(42);
  });

  it('throws on invalid JSON (prevents silent data wipe)', async () => {
    const filePath = path.join(tmpDir, 'bad.json');
    await fs.writeFile(filePath, 'not json');
    await expect(readJsonFile(filePath, { fallback: true })).rejects.toThrow();
  });

  it('throws on empty file (prevents silent data wipe)', async () => {
    const filePath = path.join(tmpDir, 'empty.json');
    await fs.writeFile(filePath, '');
    await expect(readJsonFile(filePath, { empty: true })).rejects.toThrow();
  });

  it('throws on permission error (non-ENOENT I/O error)', async () => {
    // Use a directory path as the "file" — reading a directory throws EISDIR, not ENOENT
    await expect(readJsonFile(tmpDir, { fallback: true })).rejects.toThrow();
  });
});

describe('withLockedJsonFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fileutils-'));
  });

  it('read-modify-write', async () => {
    const filePath = path.join(tmpDir, 'data.json');
    await fs.writeFile(filePath, JSON.stringify({ count: 0 }));

    const result = await withLockedJsonFile(filePath, { count: 0 }, (data) => ({
      count: data.count + 1,
    }));

    expect(result.count).toBe(1);
    const stored = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    expect(stored.count).toBe(1);
  });

  it('creates from fallback when file missing', async () => {
    const filePath = path.join(tmpDir, 'new.json');
    const result = await withLockedJsonFile(filePath, { items: [] as string[] }, (data) => ({
      items: [...data.items, 'first'],
    }));

    expect(result.items).toEqual(['first']);
    expect(fsSync.existsSync(filePath)).toBe(true);
  });

  it('lock released on error', async () => {
    const filePath = path.join(tmpDir, 'err.json');
    await fs.writeFile(filePath, JSON.stringify({ ok: true }));

    await expect(
      withLockedJsonFile(filePath, { ok: true }, () => {
        throw new Error('updater failed');
      })
    ).rejects.toThrow('updater failed');

    // Should be able to lock again (lock was released)
    const result = await withLockedJsonFile(filePath, { ok: false }, (d) => d);
    expect(result.ok).toBe(true);
  });

  it('serializes concurrent writes', async () => {
    const filePath = path.join(tmpDir, 'counter.json');
    await fs.writeFile(filePath, JSON.stringify({ count: 0 }));

    // Run 5 concurrent increments
    const promises = Array.from({ length: 5 }, () =>
      withLockedJsonFile(filePath, { count: 0 }, (data) => ({
        count: data.count + 1,
      }))
    );

    await Promise.all(promises);
    const final = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    expect(final.count).toBe(5);
  });

  it('lock released when readJsonFile throws on corrupt file', async () => {
    const filePath = path.join(tmpDir, 'corrupt.json');
    await fs.writeFile(filePath, '{ broken json');

    // First call should throw because the file is corrupt
    await expect(
      withLockedJsonFile(filePath, { ok: true }, (d) => d)
    ).rejects.toThrow();

    // Fix the file and verify lock was released (second call should succeed)
    await fs.writeFile(filePath, JSON.stringify({ ok: true }));
    const result = await withLockedJsonFile(filePath, { ok: false }, (d) => d);
    expect(result.ok).toBe(true);
  });
});
