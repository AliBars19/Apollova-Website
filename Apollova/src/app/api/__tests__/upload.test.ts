// src/app/api/__tests__/upload.test.ts
//
// Integration tests for POST /api/upload
//
// Strategy:
//   - Mock fs/promises to avoid real filesystem operations.
//   - Mock fileParser (parseFilename, generateCaption) to control parsed values.
//   - Mock fileUtils (withLockedJsonFile) to avoid JSON file I/O.
//   - Build multipart FormData using the Web API FormData/File objects.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/utils/fileParser', () => ({
  parseFilename: vi.fn(),
  generateCaption: vi.fn(),
}));

vi.mock('@/utils/fileUtils', () => ({
  withLockedJsonFile: vi.fn(),
}));

const { mockMkdir, mockWriteFile } = vi.hoisted(() => ({
  mockMkdir: vi.fn(),
  mockWriteFile: vi.fn(),
}));

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
    default: {
      ...actual,
      mkdir: mockMkdir,
      writeFile: mockWriteFile,
    },
  };
});

// ---------------------------------------------------------------------------
// Route + mock imports
// ---------------------------------------------------------------------------

import { POST } from '../upload/route';
import { parseFilename, generateCaption } from '@/utils/fileParser';
import { withLockedJsonFile } from '@/utils/fileUtils';

const mockParseFilename = vi.mocked(parseFilename);
const mockGenerateCaption = vi.mocked(generateCaption);
const mockWithLockedJsonFile = vi.mocked(withLockedJsonFile);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVideoFile(name: string, content = 'fake-video-bytes'): File {
  return new File([content], name, { type: 'video/mp4' });
}

function makeUploadRequest(file: File | null, account?: string): NextRequest {
  const formData = new FormData();
  if (file) {
    formData.append('video', file);
  }
  if (account !== undefined) {
    formData.append('account', account);
  }
  return new NextRequest('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);

  mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
    return updater([]);
  });

  // Default: parse "Song - Artist.mp4"
  mockParseFilename.mockReturnValue({ title: 'Song', artist: 'Artist' });
  mockGenerateCaption.mockReturnValue('Song - Artist #fyp');
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('POST /api/upload — happy path', () => {
  it('returns 200 with video metadata on successful upload', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.video).toBeDefined();
  });

  it('sets video status to draft', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.status).toBe('draft');
  });

  it('generates a unique video id prefixed with vid_', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.id).toMatch(/^vid_\d+$/);
  });

  it('stores url in /uploads/<filename> format', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.url).toMatch(/^\/uploads\//);
  });

  it('creates uploads directory with mkdir recursive', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    await POST(req);

    expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('writes the file bytes to disk', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    await POST(req);

    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('calls withLockedJsonFile to persist video metadata', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    await POST(req);

    expect(mockWithLockedJsonFile).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Filename parsing — "Artist - Title.mp4" convention
// ---------------------------------------------------------------------------

describe('POST /api/upload — filename parsing', () => {
  it('calls parseFilename with the original file name', async () => {
    const file = makeVideoFile('Blinding Lights - The Weeknd.mp4');
    const req = makeUploadRequest(file);

    await POST(req);

    expect(mockParseFilename).toHaveBeenCalledWith('Blinding Lights - The Weeknd.mp4');
  });

  it('uses parsed title and artist in YouTube title field', async () => {
    mockParseFilename.mockReturnValue({ title: 'Blinding Lights', artist: 'The Weeknd' });
    mockGenerateCaption.mockReturnValue('Blinding Lights - The Weeknd #fyp');

    const file = makeVideoFile('Blinding Lights - The Weeknd.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.youtube.title).toContain('Blinding Lights');
    expect(body.video.youtube.title).toContain('The Weeknd');
  });

  it('uses generateCaption output for tiktok caption', async () => {
    const expectedCaption = 'Custom Caption #fyp #music';
    mockGenerateCaption.mockReturnValue(expectedCaption);

    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.tiktok.caption).toBe(expectedCaption);
  });

  it('sanitises special characters in filename for stored filename', async () => {
    // The route replaces non-alphanumeric chars (except . and -) with underscores
    const file = makeVideoFile('Song (feat. X) - Artist!.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    // Stored filename should not contain parentheses or exclamation marks
    expect(body.video.filename).not.toMatch(/[()!]/);
  });

  it('sets YouTube category to 10 (Music)', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.youtube.category).toBe('10');
  });

  it('sets YouTube privacy to public', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.youtube.privacy).toBe('public');
  });

  it('sets tiktok status to pending', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.tiktok.status).toBe('pending');
  });

  it('sets youtube status to pending', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.youtube.status).toBe('pending');
  });
});

// ---------------------------------------------------------------------------
// Account routing
// ---------------------------------------------------------------------------

describe('POST /api/upload — account field routing', () => {
  it('defaults to aurora when account field is missing', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    // No account appended
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(body.video.account).toBe('aurora');
  });

  it.each(['aurora', 'mono', 'onyx'] as const)(
    'accepts valid account "%s"',
    async (account) => {
      const file = makeVideoFile('Song - Artist.mp4');
      const req = makeUploadRequest(file, account);

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.video.account).toBe(account);
    }
  );

  it('returns 400 for an invalid account value', async () => {
    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file, 'badaccount');

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/invalid account/i);
  });
});

// ---------------------------------------------------------------------------
// Missing file
// ---------------------------------------------------------------------------

describe('POST /api/upload — missing file', () => {
  it('returns 400 when no video file is provided', async () => {
    const req = makeUploadRequest(null);

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no video file/i);
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe('POST /api/upload — error paths', () => {
  it('returns 500 when writeFile throws', async () => {
    mockWriteFile.mockRejectedValue(new Error('Disk full'));

    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/Disk full/);
  });

  it('returns 500 when withLockedJsonFile throws', async () => {
    mockWithLockedJsonFile.mockRejectedValue(new Error('JSON write failed'));

    const file = makeVideoFile('Song - Artist.mp4');
    const req = makeUploadRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/JSON write failed/);
  });
});
