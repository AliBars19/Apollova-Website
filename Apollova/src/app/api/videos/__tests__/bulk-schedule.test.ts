// src/app/api/videos/__tests__/bulk-schedule.test.ts
//
// Integration tests for:
//   GET  /api/videos/bulk-schedule  — returns draft count and schedule preview
//   POST /api/videos/bulk-schedule  — schedules videos across hourly slots
//
// Strategy:
//   - vi.mock() fileUtils and schedulerHelper so no filesystem is touched.
//   - withLockedJsonFile is mocked to invoke the updater synchronously with the
//     provided video list, giving us full control over the in-memory store.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks — declared before route import so vi.mock hoisting works
// ---------------------------------------------------------------------------

vi.mock('@/utils/fileUtils', () => ({
  readJsonFile: vi.fn(),
  withLockedJsonFile: vi.fn(),
}));

vi.mock('@/utils/schedulerHelper', () => ({
  generateDailySchedule: vi.fn(),
  getNextAvailableSlot: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Route + mock imports
// ---------------------------------------------------------------------------

import { GET, POST } from '../bulk-schedule/route';
import { readJsonFile, withLockedJsonFile } from '@/utils/fileUtils';
import { generateDailySchedule, getNextAvailableSlot } from '@/utils/schedulerHelper';

const mockReadJsonFile = vi.mocked(readJsonFile);
const mockWithLockedJsonFile = vi.mocked(withLockedJsonFile);
const mockGenerateDailySchedule = vi.mocked(generateDailySchedule);
const mockGetNextAvailableSlot = vi.mocked(getNextAvailableSlot);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDraftVideo(id: string, filename: string) {
  return { id, filename, status: 'draft' };
}

function makeScheduledVideo(id: string, filename: string) {
  return { id, filename, status: 'scheduled', scheduledAt: '2025-01-01T11:00:00.000Z' };
}

/** Builds a fixed set of 12 ISO strings representing 11 AM – 11 PM today */
function makeDailySlots(dateStr = '2026-03-23'): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const h = 11 + i;
    return `${dateStr}T${String(h).padStart(2, '0')}:00:00.000Z`;
  });
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/videos/bulk-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Setup — configure withLockedJsonFile to call the updater synchronously
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Default: withLockedJsonFile invokes the updater with the provided videos
  // and returns whatever the updater returns. This simulates the real behaviour
  // without any filesystem I/O.
  mockWithLockedJsonFile.mockImplementation(async (_file, _fallback, updater) => {
    return updater([]);
  });

  // Default schedule: all 12 future slots
  const farFuture = makeDailySlots('2099-01-01');
  mockGenerateDailySchedule.mockReturnValue(farFuture);
  mockGetNextAvailableSlot.mockReturnValue(farFuture[0]);
  mockReadJsonFile.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET tests
// ---------------------------------------------------------------------------

describe('GET /api/videos/bulk-schedule', () => {
  it('returns draftCount and scheduledCount from the video store', async () => {
    const videos = [
      makeDraftVideo('v1', 'a.mp4'),
      makeDraftVideo('v2', 'b.mp4'),
      makeScheduledVideo('v3', 'c.mp4'),
    ];
    mockReadJsonFile.mockResolvedValue(videos);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.draftCount).toBe(2);
    expect(body.scheduledCount).toBe(1);
  });

  it('returns the next available slot from schedulerHelper', async () => {
    const nextSlot = '2099-01-01T11:00:00.000Z';
    mockGetNextAvailableSlot.mockReturnValue(nextSlot);
    mockReadJsonFile.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.nextAvailableSlot).toBe(nextSlot);
  });

  it('returns slotsPerDay=12 and scheduleRange description', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.slotsPerDay).toBe(12);
    expect(body.scheduleRange).toMatch(/11 AM/i);
    expect(body.scheduleRange).toMatch(/11 PM/i);
  });

  it('returns availableSlotsToday=0 when all slots are in the past', async () => {
    // All slots in the past
    const pastSlots = makeDailySlots('2000-01-01');
    mockGenerateDailySchedule.mockReturnValue(pastSlots);
    mockGetNextAvailableSlot.mockReturnValue(null);
    mockReadJsonFile.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.availableSlotsToday).toBe(0);
    expect(body.nextAvailableSlot).toBeNull();
  });

  it('returns draftCount=0 when store is empty', async () => {
    mockReadJsonFile.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.draftCount).toBe(0);
    expect(body.scheduledCount).toBe(0);
  });

  it('returns 500 when readJsonFile throws', async () => {
    mockReadJsonFile.mockRejectedValue(new Error('Disk read error'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/Disk read error/);
  });
});

// ---------------------------------------------------------------------------
// POST — schedule by videoIds
// ---------------------------------------------------------------------------

describe('POST /api/videos/bulk-schedule — schedule by videoIds', () => {
  it('schedules specified videos and returns success with summary', async () => {
    const videos = [
      makeDraftVideo('v1', 'Song - Artist.mp4'),
      makeDraftVideo('v2', 'Other - Band.mp4'),
    ];
    const futureSlots = makeDailySlots('2099-01-01');
    mockGenerateDailySchedule.mockReturnValue(futureSlots);

    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater(videos);
    });

    const req = makePostRequest({ videoIds: ['v1'] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.summary.totalScheduled).toBe(1);
    expect(body.summary.schedule[0].videoId).toBe('v1');
    expect(body.summary.schedule[0].filename).toBe('Song - Artist.mp4');
  });

  it('assigns the first available slot to the scheduled video', async () => {
    const videos = [makeDraftVideo('v1', 'a.mp4')];
    const futureSlots = makeDailySlots('2099-01-01');
    mockGenerateDailySchedule.mockReturnValue(futureSlots);

    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater(videos);
    });

    const req = makePostRequest({ videoIds: ['v1'] });
    const res = await POST(req);
    const body = await res.json();

    expect(body.summary.schedule[0].scheduledAt).toBe(futureSlots[0]);
  });

  it('assigns consecutive slots across multiple videos', async () => {
    const videos = [
      makeDraftVideo('v1', 'a.mp4'),
      makeDraftVideo('v2', 'b.mp4'),
      makeDraftVideo('v3', 'c.mp4'),
    ];
    const futureSlots = makeDailySlots('2099-01-01');
    mockGenerateDailySchedule.mockReturnValue(futureSlots);

    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater(videos);
    });

    const req = makePostRequest({ videoIds: ['v1', 'v2', 'v3'] });
    const res = await POST(req);
    const body = await res.json();

    expect(body.summary.totalScheduled).toBe(3);
    expect(body.summary.schedule[0].scheduledAt).toBe(futureSlots[0]);
    expect(body.summary.schedule[1].scheduledAt).toBe(futureSlots[1]);
    expect(body.summary.schedule[2].scheduledAt).toBe(futureSlots[2]);
  });

  it('returns 400 when no videos match the provided videoIds', async () => {
    const videos = [makeDraftVideo('v1', 'a.mp4')];
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater(videos);
    });

    const req = makePostRequest({ videoIds: ['non-existent-id'] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no videos to schedule/i);
  });

  it('returns 400 when videoIds is empty array', async () => {
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([makeDraftVideo('v1', 'a.mp4')]);
    });

    const req = makePostRequest({ videoIds: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no videos to schedule/i);
  });
});

// ---------------------------------------------------------------------------
// POST — scheduleAll flag
// ---------------------------------------------------------------------------

describe('POST /api/videos/bulk-schedule — scheduleAll flag', () => {
  it('schedules all draft videos when scheduleAll=true', async () => {
    const videos = [
      makeDraftVideo('d1', 'draft1.mp4'),
      makeDraftVideo('d2', 'draft2.mp4'),
      makeScheduledVideo('s1', 'already.mp4'),
    ];
    const futureSlots = makeDailySlots('2099-01-01');
    mockGenerateDailySchedule.mockReturnValue(futureSlots);

    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater(videos);
    });

    const req = makePostRequest({ scheduleAll: true });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    // Only the 2 drafts should be scheduled; the already-scheduled one is skipped
    expect(body.summary.totalScheduled).toBe(2);
  });

  it('returns 400 when scheduleAll=true but there are no draft videos', async () => {
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([makeScheduledVideo('s1', 'a.mp4')]);
    });

    const req = makePostRequest({ scheduleAll: true });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no videos to schedule/i);
  });
});

// ---------------------------------------------------------------------------
// POST — slot generation (11 AM – 11 PM hourly)
// ---------------------------------------------------------------------------

describe('POST /api/videos/bulk-schedule — slot generation', () => {
  it('uses a future startDate when provided', async () => {
    const startDate = '2099-06-15';
    const slots = makeDailySlots(startDate);
    mockGenerateDailySchedule.mockReturnValue(slots);

    const videos = [makeDraftVideo('v1', 'a.mp4')];
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater(videos);
    });

    const req = makePostRequest({ videoIds: ['v1'], startDate });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.schedule[0].scheduledAt).toBe(slots[0]);
  });

  it('rolls over to the next day when 12 slots on day 1 are filled', async () => {
    // Create 13 draft videos so we need a rollover to day 2
    const videos = Array.from({ length: 13 }, (_, i) =>
      makeDraftVideo(`v${i}`, `video${i}.mp4`)
    );

    const day1Slots = makeDailySlots('2099-01-01');
    const day2Slots = makeDailySlots('2099-01-02');
    // First call returns day1, subsequent calls return day2
    mockGenerateDailySchedule
      .mockReturnValueOnce(day1Slots)  // initial day
      .mockReturnValue(day2Slots);     // rollover days

    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater(videos);
    });

    const req = makePostRequest({ scheduleAll: true, startDate: '2099-01-01' });
    const res = await POST(req);
    const body = await res.json();

    expect(body.summary.totalScheduled).toBe(13);
    // First 12 on day1, 13th on day2
    expect(body.summary.schedule[11].scheduledAt).toBe(day1Slots[11]);
    expect(body.summary.schedule[12].scheduledAt).toBe(day2Slots[0]);
  });

  it('calculates daysUsed correctly in the summary', async () => {
    // 13 videos → ceil(13/12) = 2 days
    const videos = Array.from({ length: 13 }, (_, i) =>
      makeDraftVideo(`v${i}`, `v${i}.mp4`)
    );
    const day1Slots = makeDailySlots('2099-01-01');
    const day2Slots = makeDailySlots('2099-01-02');
    mockGenerateDailySchedule
      .mockReturnValueOnce(day1Slots)
      .mockReturnValue(day2Slots);

    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater(videos);
    });

    const req = makePostRequest({ scheduleAll: true, startDate: '2099-01-01' });
    const res = await POST(req);
    const body = await res.json();

    expect(body.summary.daysUsed).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// POST — body without either flag
// ---------------------------------------------------------------------------

describe('POST /api/videos/bulk-schedule — no scheduling criteria', () => {
  it('returns 400 when neither videoIds nor scheduleAll is provided', async () => {
    mockWithLockedJsonFile.mockImplementation(async (_f, _fb, updater) => {
      return updater([makeDraftVideo('v1', 'a.mp4')]);
    });

    const req = makePostRequest({});
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no videos to schedule/i);
  });
});

// ---------------------------------------------------------------------------
// POST — error path
// ---------------------------------------------------------------------------

describe('POST /api/videos/bulk-schedule — error handling', () => {
  it('returns 500 when withLockedJsonFile throws', async () => {
    mockWithLockedJsonFile.mockRejectedValue(new Error('Lock acquisition failed'));

    const req = makePostRequest({ scheduleAll: true });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/Lock acquisition failed/);
  });

  it('returns 500 when request body is malformed JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/videos/bulk-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{{',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});
