// src/utils/fileUtils.ts
// Provides atomic file writes and in-memory mutex for serializing
// read-modify-write operations on shared JSON files (videos.json, tokens.json).

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

/**
 * Simple async mutex — serializes access to a shared resource.
 * One mutex per file path ensures no concurrent read-modify-write.
 */
class AsyncMutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      const tryAcquire = () => {
        if (!this.locked) {
          this.locked = true;
          resolve(() => this.release());
        } else {
          this.queue.push(tryAcquire);
        }
      };
      tryAcquire();
    });
  }

  private release() {
    this.locked = false;
    const next = this.queue.shift();
    if (next) next();
  }
}

// One mutex per file path
const mutexes = new Map<string, AsyncMutex>();

function getMutex(filePath: string): AsyncMutex {
  let mutex = mutexes.get(filePath);
  if (!mutex) {
    mutex = new AsyncMutex();
    mutexes.set(filePath, mutex);
  }
  return mutex;
}

/**
 * Atomic write: writes to a temp file in the same directory, then renames.
 * Rename is atomic on Linux/Mac (the production server runs Linux).
 */
async function atomicWriteFile(filePath: string, data: string): Promise<void> {
  const dir = path.dirname(filePath);
  const tmpFile = path.join(dir, `.${path.basename(filePath)}.tmp.${process.pid}`);

  await fs.writeFile(tmpFile, data, 'utf-8');
  await fs.rename(tmpFile, filePath);
}

/**
 * Atomic write (synchronous version for tokenManager which uses sync fs).
 */
export function atomicWriteFileSync(filePath: string, data: string): void {
  const dir = path.dirname(filePath);
  const tmpFile = path.join(dir, `.${path.basename(filePath)}.tmp.${process.pid}`);

  fsSync.writeFileSync(tmpFile, data, 'utf-8');
  fsSync.renameSync(tmpFile, filePath);
}

/**
 * Read a JSON file safely.
 * Returns fallback only when the file does not exist.
 * Throws on corruption or unexpected I/O errors so callers don't
 * silently overwrite good data with an empty fallback.
 */
export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err: unknown) {
    // File doesn't exist yet — that's fine, use the fallback
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return fallback;
    }
    // Any other error (corrupt JSON, permission denied, disk I/O) — rethrow
    // so callers don't accidentally wipe good data with an empty array
    throw err;
  }
}

/**
 * Locked read-modify-write for a JSON file.
 * The updater receives the current data and returns the new data to write.
 * No other operation on the same file can interleave.
 */
export async function withLockedJsonFile<T>(
  filePath: string,
  fallback: T,
  updater: (current: T) => T | Promise<T>
): Promise<T> {
  const mutex = getMutex(filePath);
  const release = await mutex.acquire();

  try {
    const current = await readJsonFile<T>(filePath, fallback);
    const updated = await updater(current);
    await atomicWriteFile(filePath, JSON.stringify(updated, null, 2));
    return updated;
  } finally {
    release();
  }
}
