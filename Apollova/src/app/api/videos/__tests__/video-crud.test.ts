// src/app/api/videos/__tests__/video-crud.test.ts
//
// Integration tests for:
//   DELETE /api/videos/[id]  — removes video record and deletes the file
//   PATCH  /api/videos/[id]  — updates video fields
//
// The [id]/route.ts file only exposes DELETE and PATCH (no GET handler).
//
// Strategy:
//   - Mock withLockedJsonFile to drive the in-memory video store.
//   - Mock fs/promises.unlink to avoid real filesystem operations.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/utils/fileUtils', () => ({
  withLockedJsonFile: vi.fn(),
}));

const { mockUnlink } = vi.hoisted(() => ({ mockUnlink: vi.fn() }));

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    unlink: mockUnlink,
    default: {
      ...actual,
      unlink: mockUnlink,
    },
  };
});

// ---------------------------------------------------------------------------
// Route + mock imports
// ---------------------------------------------------------------------------

import { DELETE, PATCH } from '../[id]/route';
import { withLockedJsonFile } from '@/utils/fileUtils';

const mockWithLockedJsonFile = vi.mocked(withLockedJsonFile);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeVideo(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vid-001',
    filename: '1234_Song_Artist.mp4',
    url: '/uploads/1234_Song_Artist.mp4',
    uploadedAt: '2025-01-01T00:00:00.000Z',
    status: 'draft',
    account: 'aurora',
    tiktok: { caption: 'Test caption', status: 'pending' },
    youtube: {
      title: 'Test Video',
      description: 'Description',
      tags: ['music'],
      category: '10',
      privacy: 'public',
      status: 'pending',
    },
    ...overrides,
  };
}

function makeParams(id = 'vid-001') {
  return { params: Promise.resolve({ id }) };
}

function makePatchRequest(id: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/videos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/videos/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockUnlink.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// DELETE tests
// ---------------------------------------------------------------------------

describe('DELETE /api/videos/[id]', () => {
  it('returns ok:true when video is found and deleted', async () => {
    const video = makeVideo();
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makeDeleteRequest('vid-001');
    const res = await DELETE(req, makeParams('vid-001'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it('calls fs.unlink with the correct file path', async () => {
    const video = makeVideo({ url: '/uploads/1234_Song_Artist.mp4' });
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makeDeleteRequest('vid-001');
    await DELETE(req, makeParams('vid-001'));

    expect(mockUnlink).toHaveBeenCalledOnce();
    const calledPath: string = mockUnlink.mock.calls[0][0];
    expect(calledPath).toContain('1234_Song_Artist.mp4');
  });

  it('returns 404 when video id does not exist', async () => {
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([makeVideo()]);
    });

    const req = makeDeleteRequest('non-existent');
    const res = await DELETE(req, makeParams('non-existent'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Video not found');
  });

  it('returns 404 when the video store is empty', async () => {
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([]);
    });

    const req = makeDeleteRequest('vid-001');
    const res = await DELETE(req, makeParams('vid-001'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Video not found');
  });

  it('does not throw when unlink fails (file already gone)', async () => {
    const video = makeVideo();
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });
    mockUnlink.mockRejectedValue(new Error('ENOENT: no such file'));

    const req = makeDeleteRequest('vid-001');
    const res = await DELETE(req, makeParams('vid-001'));

    // Route should still succeed even if file deletion fails
    expect(res.status).toBe(200);
  });

  it('removes the correct video from a multi-video store', async () => {
    const videos = [
      makeVideo({ id: 'vid-001', filename: 'a.mp4', url: '/uploads/a.mp4' }),
      makeVideo({ id: 'vid-002', filename: 'b.mp4', url: '/uploads/b.mp4' }),
    ];

    let capturedResult: unknown[] = [];
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      capturedResult = await updater([...videos]);
      return capturedResult;
    });

    const req = makeDeleteRequest('vid-001');
    await DELETE(req, makeParams('vid-001'));

    // vid-002 should remain
    expect(capturedResult).toHaveLength(1);
    expect((capturedResult[0] as { id: string }).id).toBe('vid-002');
  });
});

// ---------------------------------------------------------------------------
// PATCH tests
// ---------------------------------------------------------------------------

describe('PATCH /api/videos/[id]', () => {
  it('returns ok:true and the updated video on success', async () => {
    const video = makeVideo();
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', { status: 'scheduled' });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.video).toBeDefined();
  });

  it('updates the status field', async () => {
    const video = makeVideo({ status: 'draft' });
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', { status: 'scheduled' });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(body.video.status).toBe('scheduled');
  });

  it('updates tiktok caption via top-level caption field', async () => {
    const video = makeVideo();
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', { caption: 'New caption #fyp' });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(body.video.tiktok.caption).toBe('New caption #fyp');
  });

  it('mirrors caption to youtube description', async () => {
    const video = makeVideo();
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', { caption: 'Shared caption' });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(body.video.youtube.description).toBe('Shared caption');
  });

  it('merges tiktok sub-object updates', async () => {
    const video = makeVideo();
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', {
      tiktok: { caption: 'TikTok specific', status: 'published' },
    });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(body.video.tiktok.caption).toBe('TikTok specific');
    expect(body.video.tiktok.status).toBe('published');
  });

  it('merges youtube sub-object updates', async () => {
    const video = makeVideo();
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', {
      youtube: { title: 'New YouTube Title', privacy: 'private' },
    });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(body.video.youtube.title).toBe('New YouTube Title');
    expect(body.video.youtube.privacy).toBe('private');
  });

  it('sets status to scheduled and stores scheduledAt when scheduledAt is provided', async () => {
    const video = makeVideo({ status: 'draft' });
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const scheduledAt = '2099-01-01T14:00:00.000Z';
    const req = makePatchRequest('vid-001', { scheduledAt });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(body.video.scheduledAt).toBe(scheduledAt);
    expect(body.video.status).toBe('scheduled');
  });

  it('clears scheduledAt and reverts to draft when scheduledAt is null', async () => {
    const video = makeVideo({ status: 'scheduled', scheduledAt: '2099-01-01T14:00:00.000Z' });
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', { scheduledAt: null });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(body.video.scheduledAt).toBeUndefined();
    expect(body.video.status).toBe('draft');
  });

  it('updates account when a valid account value is provided', async () => {
    const video = makeVideo({ account: 'aurora' });
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', { account: 'mono' });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(body.video.account).toBe('mono');
  });

  it('ignores invalid account values', async () => {
    const video = makeVideo({ account: 'aurora' });
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', { account: 'badaccount' });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    // Account should remain unchanged
    expect(body.video.account).toBe('aurora');
  });

  it('returns 404 when video id does not exist', async () => {
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([makeVideo()]);
    });

    const req = makePatchRequest('non-existent', { status: 'draft' });
    const res = await PATCH(req, makeParams('non-existent'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Video not found');
  });

  it('returns 404 when the video store is empty', async () => {
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([]);
    });

    const req = makePatchRequest('vid-001', { status: 'draft' });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Video not found');
  });

  it('initialises missing tiktok object before applying updates', async () => {
    // Video without tiktok field
    const video = { id: 'vid-001', filename: 'a.mp4', url: '/uploads/a.mp4',
      uploadedAt: '2025-01-01T00:00:00.000Z', status: 'draft', account: 'aurora' };
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([video]);
    });

    const req = makePatchRequest('vid-001', { tiktok: { caption: 'Hi' } });
    const res = await PATCH(req, makeParams('vid-001'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.video.tiktok.caption).toBe('Hi');
  });
});
