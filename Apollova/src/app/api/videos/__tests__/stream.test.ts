// src/app/api/videos/__tests__/stream.test.ts
//
// Integration tests for GET /api/videos/stream/[filename]
//
// Route behaviour:
//   1. Decodes the URL-encoded filename
//   2. Strips directory components with path.basename() (traversal prevention)
//   3. Resolves + verifies the final path stays inside UPLOADS_DIR
//   4. Reads the file and streams the buffer as video/mp4
//   5. Returns 404 for any fs error (file missing, permission denied, etc.)
//
// Strategy:
//   - Mock 'fs/promises' readFile so we never touch the filesystem.
//   - The path-resolution logic (basename, resolve, startsWith) is NOT mocked —
//     we verify its correctness by checking what readFile is called with.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import path from 'path';

// ---------------------------------------------------------------------------
// Module mock — readFile only; leave the rest of fs/promises real
// ---------------------------------------------------------------------------

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Route import
// ---------------------------------------------------------------------------

import { GET } from '../stream/[filename]/route';
import { readFile } from 'fs/promises';

const mockReadFile = vi.mocked(readFile);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(filename: string): NextRequest {
  const encoded = encodeURIComponent(filename);
  return new NextRequest(`http://localhost:3000/api/videos/stream/${encoded}`);
}

function makeParams(filename: string) {
  return { params: Promise.resolve({ filename }) };
}

// A real-looking video buffer (just bytes, content doesn't matter)
function fakeVideoBuffer(size = 1024): Buffer {
  return Buffer.alloc(size, 0x00);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('GET /api/videos/stream/[filename] — happy path', () => {
  it('returns 200 with correct content-type for a valid file', async () => {
    const buf = fakeVideoBuffer(2048);
    mockReadFile.mockResolvedValue(buf);

    const req = makeRequest('my-video.mp4');
    const res = await GET(req, makeParams('my-video.mp4'));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
  });

  it('sets Content-Length header matching the buffer size', async () => {
    const buf = fakeVideoBuffer(4096);
    mockReadFile.mockResolvedValue(buf);

    const req = makeRequest('my-video.mp4');
    const res = await GET(req, makeParams('my-video.mp4'));

    expect(res.headers.get('content-length')).toBe('4096');
  });

  it('sets Accept-Ranges: bytes to signal range support', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const req = makeRequest('clip.mp4');
    const res = await GET(req, makeParams('clip.mp4'));

    expect(res.headers.get('accept-ranges')).toBe('bytes');
  });

  it('sets Cache-Control header for long-term caching', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const req = makeRequest('clip.mp4');
    const res = await GET(req, makeParams('clip.mp4'));

    const cacheControl = res.headers.get('cache-control');
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain('max-age');
  });

  it('returns the actual file bytes in the response body', async () => {
    const expectedContent = Buffer.from('fake-video-bytes-1234');
    mockReadFile.mockResolvedValue(expectedContent);

    const req = makeRequest('sample.mp4');
    const res = await GET(req, makeParams('sample.mp4'));

    const responseBuffer = Buffer.from(await res.arrayBuffer());
    expect(responseBuffer).toEqual(expectedContent);
  });

  it('reads from the correct path inside UPLOADS_DIR', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const req = makeRequest('aurora-001.mp4');
    await GET(req, makeParams('aurora-001.mp4'));

    expect(mockReadFile).toHaveBeenCalledWith(
      path.join(UPLOADS_DIR, 'aurora-001.mp4')
    );
  });

  it('handles URL-encoded filenames by decoding before reading', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const encodedName = 'my%20video%20file.mp4';
    const req = makeRequest(encodedName);
    await GET(req, makeParams(encodedName));

    // Should have decoded the %20 to spaces
    expect(mockReadFile).toHaveBeenCalledWith(
      path.join(UPLOADS_DIR, 'my video file.mp4')
    );
  });

  it('handles filenames with special characters (unicode)', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const filename = 'vid\u00e9o.mp4'; // "vidéo.mp4"
    const req = makeRequest(filename);
    await GET(req, makeParams(filename));

    expect(mockReadFile).toHaveBeenCalledWith(
      path.join(UPLOADS_DIR, filename)
    );
  });
});

// ---------------------------------------------------------------------------
// Path traversal prevention
// ---------------------------------------------------------------------------

describe('GET /api/videos/stream/[filename] — path traversal prevention', () => {
  it('strips ../ components — ../../etc/passwd cannot escape UPLOADS_DIR', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    // After basename() the path is just 'passwd', so readFile is called
    // with UPLOADS_DIR/passwd (which then 404s if the file is missing).
    // The key assertion is that readFile is NOT called with /etc/passwd.
    const traversalName = '../../etc/passwd';
    const req = makeRequest(traversalName);
    await GET(req, makeParams(traversalName));

    const calledWith = mockReadFile.mock.calls[0]?.[0] as string | undefined;
    if (calledWith) {
      // Must stay inside UPLOADS_DIR
      expect(path.resolve(calledWith as string).startsWith(path.resolve(UPLOADS_DIR))).toBe(true);
    }
    // readFile should be called with the safe path ('passwd'), not /etc/passwd
    expect(mockReadFile).not.toHaveBeenCalledWith('/etc/passwd');
  });

  it('strips ..\\..\\windows\\system32 (Windows-style traversal)', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const traversalName = '..\\..\\windows\\system32\\cmd.exe';
    const req = makeRequest(traversalName);
    await GET(req, makeParams(traversalName));

    const calledWith = mockReadFile.mock.calls[0]?.[0] as string | undefined;
    if (calledWith) {
      expect((calledWith as string).startsWith(path.resolve(UPLOADS_DIR))).toBe(true);
    }
  });

  it('handles encoded path separators (%2F) safely', async () => {
    // %2F is a forward slash — after decodeURIComponent this becomes a path sep
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const traversalName = '..%2Fsecrets.json';
    const req = makeRequest(traversalName);
    await GET(req, makeParams(traversalName));

    const calledWith = mockReadFile.mock.calls[0]?.[0] as string;
    // basename will reduce this to just 'secrets.json' or similar safe name
    expect(path.resolve(calledWith).startsWith(path.resolve(UPLOADS_DIR))).toBe(true);
  });

  it('handles absolute path filenames safely', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const absPath = '/etc/shadow';
    const req = makeRequest(absPath);
    await GET(req, makeParams(absPath));

    const calledWith = mockReadFile.mock.calls[0]?.[0] as string;
    // basename('/etc/shadow') === 'shadow', so path should resolve inside UPLOADS_DIR
    expect(path.resolve(calledWith).startsWith(path.resolve(UPLOADS_DIR))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Error cases — 404
// ---------------------------------------------------------------------------

describe('GET /api/videos/stream/[filename] — error handling', () => {
  it('returns 404 when file does not exist (ENOENT)', async () => {
    const error = Object.assign(new Error('no such file'), { code: 'ENOENT' });
    mockReadFile.mockRejectedValue(error);

    const req = makeRequest('missing.mp4');
    const res = await GET(req, makeParams('missing.mp4'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Video not found');
  });

  it('returns 404 when file read fails with a permission error', async () => {
    const error = Object.assign(new Error('permission denied'), { code: 'EACCES' });
    mockReadFile.mockRejectedValue(error);

    const req = makeRequest('restricted.mp4');
    const res = await GET(req, makeParams('restricted.mp4'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Video not found');
  });

  it('returns 404 when readFile throws a generic error', async () => {
    mockReadFile.mockRejectedValue(new Error('Unexpected error'));

    const req = makeRequest('broken.mp4');
    const res = await GET(req, makeParams('broken.mp4'));
    const body = await res.json();

    expect(res.status).toBe(404);
  });

  it('returns JSON error body (not a stream) on 404', async () => {
    mockReadFile.mockRejectedValue(new Error('not found'));

    const req = makeRequest('ghost.mp4');
    const res = await GET(req, makeParams('ghost.mp4'));

    // Ensure response is JSON parseable
    const body = await res.json();
    expect(typeof body).toBe('object');
    expect(body.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('GET /api/videos/stream/[filename] — edge cases', () => {
  it('handles a zero-byte file without crashing', async () => {
    mockReadFile.mockResolvedValue(Buffer.alloc(0));

    const req = makeRequest('empty.mp4');
    const res = await GET(req, makeParams('empty.mp4'));

    // Should not crash — returns 200 with 0 byte body
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBe('0');
  });

  it('handles very large filenames without path injection (name stays as basename)', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const longName = 'a'.repeat(200) + '.mp4';
    const req = makeRequest(longName);
    await GET(req, makeParams(longName));

    expect(mockReadFile).toHaveBeenCalledWith(
      path.join(UPLOADS_DIR, longName)
    );
  });

  it('handles filename with no extension', async () => {
    mockReadFile.mockResolvedValue(fakeVideoBuffer());

    const req = makeRequest('videofile');
    const res = await GET(req, makeParams('videofile'));

    // Still responds — content type is always video/mp4 per route implementation
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
  });
});
