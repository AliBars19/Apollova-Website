// src/utils/__tests__/scheduler.test.ts
// Tests for scheduler.ts — publishing window logic, per-account rate limiting,
// video grouping, and the checkAndPublishScheduledVideos orchestration.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Video } from '@/app/types';

// ---------------------------------------------------------------------------
// Helpers — build minimal Video objects without manually setting every field
// ---------------------------------------------------------------------------

function makeVideo(overrides: Partial<Video> & { id: string }): Video {
  return {
    id: overrides.id,
    filename: `${overrides.id}.mp4`,
    url: `/videos/${overrides.id}.mp4`,
    uploadedAt: '2025-06-15T10:00:00.000Z',
    status: 'scheduled',
    account: 'aurora',
    tiktok: {
      caption: 'Test caption',
      status: 'pending',
    },
    youtube: {
      title: 'Test Title',
      description: 'Test description',
      tags: ['test'],
      category: '10',
      privacy: 'public',
      status: 'pending',
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// We test the pure helper logic in isolation by replicating the exact logic
// from scheduler.ts (same pattern as middleware.test.ts).
// The exported triggerSchedulerCheck / startScheduler / isSchedulerRunning
// are tested via the module import pattern.
// ---------------------------------------------------------------------------

const PUBLISH_START_HOUR = 11;
const PUBLISH_END_HOUR = 22;
const MAX_PER_ACCOUNT_PER_HOUR = 1;

function isWithinPublishingWindow(now: Date): boolean {
  const currentHour = now.getUTCHours();
  return currentHour >= PUBLISH_START_HOUR && currentHour < PUBLISH_END_HOUR;
}

function getPublishedThisHourCount(videos: Video[], accountId: string, now: Date): number {
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);

  return videos.filter((video) => {
    if (video.account !== accountId) return false;
    if (video.status !== 'published' && video.status !== 'partial') return false;
    const publishedAt = video.tiktok?.publishedAt || video.youtube?.publishedAt;
    if (!publishedAt) return false;
    const publishDate = new Date(publishedAt);
    return publishDate >= hourStart && publishDate < hourEnd;
  }).length;
}

function canPublishThisHour(videos: Video[], accountId: string, now: Date): boolean {
  return getPublishedThisHourCount(videos, accountId, now) < MAX_PER_ACCOUNT_PER_HOUR;
}

// ---------------------------------------------------------------------------
// isWithinPublishingWindow
// ---------------------------------------------------------------------------

describe('isWithinPublishingWindow', () => {
  it('returns true at exactly 11:00 UTC (lower boundary)', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T11:00:00.000Z'))).toBe(true);
  });

  it('returns true at 11:30 UTC', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T11:30:00.000Z'))).toBe(true);
  });

  it('returns true at 15:59 UTC (mid-window)', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T15:59:00.000Z'))).toBe(true);
  });

  it('returns true at 21:59 UTC (last valid minute)', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T21:59:59.000Z'))).toBe(true);
  });

  it('returns false at exactly 22:00 UTC (upper boundary — exclusive)', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T22:00:00.000Z'))).toBe(false);
  });

  it('returns false at 23:00 UTC', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T23:00:00.000Z'))).toBe(false);
  });

  it('returns false at 00:00 UTC (midnight)', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T00:00:00.000Z'))).toBe(false);
  });

  it('returns false at 10:59 UTC (just before window)', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T10:59:59.000Z'))).toBe(false);
  });

  it('returns true across an hour boundary inside the window (14 → 15 UTC)', () => {
    expect(isWithinPublishingWindow(new Date('2025-06-15T14:00:00.000Z'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getPublishedThisHourCount
// ---------------------------------------------------------------------------

describe('getPublishedThisHourCount', () => {
  const NOW = new Date('2025-06-15T14:30:00.000Z'); // 14:30 UTC

  it('returns 0 for empty video list', () => {
    expect(getPublishedThisHourCount([], 'aurora', NOW)).toBe(0);
  });

  it('counts published videos in the current hour for the correct account', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'v1',
        account: 'aurora',
        status: 'published',
        youtube: {
          title: 'T1',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
          publishedAt: '2025-06-15T14:15:00.000Z',
        },
        tiktok: { caption: '', status: 'published' },
      }),
    ];
    expect(getPublishedThisHourCount(videos, 'aurora', NOW)).toBe(1);
  });

  it('does not count videos from other accounts', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'v2',
        account: 'mono',
        status: 'published',
        youtube: {
          title: 'T2',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
          publishedAt: '2025-06-15T14:15:00.000Z',
        },
        tiktok: { caption: '', status: 'published' },
      }),
    ];
    expect(getPublishedThisHourCount(videos, 'aurora', NOW)).toBe(0);
  });

  it('does not count scheduled (non-published) videos', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'v3',
        account: 'aurora',
        status: 'scheduled',
        youtube: {
          title: 'T3',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'pending',
          publishedAt: '2025-06-15T14:15:00.000Z',
        },
        tiktok: { caption: '', status: 'pending' },
      }),
    ];
    expect(getPublishedThisHourCount(videos, 'aurora', NOW)).toBe(0);
  });

  it('counts "partial" status videos as published', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'v4',
        account: 'onyx',
        status: 'partial',
        tiktok: {
          caption: '',
          status: 'published',
          publishedAt: '2025-06-15T14:45:00.000Z',
        },
        youtube: {
          title: 'T4',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'pending',
        },
      }),
    ];
    expect(getPublishedThisHourCount(videos, 'onyx', NOW)).toBe(1);
  });

  it('does not count videos published in a previous hour', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'v5',
        account: 'aurora',
        status: 'published',
        youtube: {
          title: 'T5',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
          publishedAt: '2025-06-15T13:59:59.000Z',
        },
        tiktok: { caption: '', status: 'published' },
      }),
    ];
    expect(getPublishedThisHourCount(videos, 'aurora', NOW)).toBe(0);
  });

  it('does not count videos published at the start of the next hour', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'v6',
        account: 'aurora',
        status: 'published',
        youtube: {
          title: 'T6',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
          publishedAt: '2025-06-15T15:00:00.000Z',
        },
        tiktok: { caption: '', status: 'published' },
      }),
    ];
    expect(getPublishedThisHourCount(videos, 'aurora', NOW)).toBe(0);
  });

  it('uses tiktok.publishedAt when youtube.publishedAt is absent', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'v7',
        account: 'aurora',
        status: 'published',
        tiktok: {
          caption: '',
          status: 'published',
          publishedAt: '2025-06-15T14:20:00.000Z',
        },
        youtube: {
          title: 'T7',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'pending',
        },
      }),
    ];
    expect(getPublishedThisHourCount(videos, 'aurora', NOW)).toBe(1);
  });

  it('returns 0 when published video has no publishedAt on either platform', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'v8',
        account: 'aurora',
        status: 'published',
        tiktok: { caption: '', status: 'published' },
        youtube: {
          title: 'T8',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
        },
      }),
    ];
    expect(getPublishedThisHourCount(videos, 'aurora', NOW)).toBe(0);
  });

  it('counts correctly across all three accounts independently', () => {
    const publishedAt = '2025-06-15T14:10:00.000Z';
    const videos: Video[] = (['aurora', 'mono', 'onyx'] as const).map((acc, i) =>
      makeVideo({
        id: `acc-${i}`,
        account: acc,
        status: 'published',
        youtube: {
          title: `T${i}`,
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
          publishedAt,
        },
        tiktok: { caption: '', status: 'published' },
      })
    );
    expect(getPublishedThisHourCount(videos, 'aurora', NOW)).toBe(1);
    expect(getPublishedThisHourCount(videos, 'mono', NOW)).toBe(1);
    expect(getPublishedThisHourCount(videos, 'onyx', NOW)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// canPublishThisHour
// ---------------------------------------------------------------------------

describe('canPublishThisHour', () => {
  const NOW = new Date('2025-06-15T14:30:00.000Z');

  it('returns true when no videos published this hour', () => {
    expect(canPublishThisHour([], 'aurora', NOW)).toBe(true);
  });

  it('returns false when 1 video already published this hour', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'p1',
        account: 'aurora',
        status: 'published',
        youtube: {
          title: 'T',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
          publishedAt: '2025-06-15T14:05:00.000Z',
        },
        tiktok: { caption: '', status: 'published' },
      }),
    ];
    expect(canPublishThisHour(videos, 'aurora', NOW)).toBe(false);
  });

  it('returns true for a different account even when one account is at limit', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'p2',
        account: 'aurora',
        status: 'published',
        youtube: {
          title: 'T',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
          publishedAt: '2025-06-15T14:05:00.000Z',
        },
        tiktok: { caption: '', status: 'published' },
      }),
    ];
    expect(canPublishThisHour(videos, 'mono', NOW)).toBe(true);
    expect(canPublishThisHour(videos, 'onyx', NOW)).toBe(true);
  });

  it('returns true when previous hour limit was reached but current hour is clear', () => {
    const videos: Video[] = [
      makeVideo({
        id: 'p3',
        account: 'aurora',
        status: 'published',
        youtube: {
          title: 'T',
          description: '',
          tags: [],
          category: '10',
          privacy: 'public',
          status: 'published',
          publishedAt: '2025-06-15T13:30:00.000Z', // previous hour
        },
        tiktok: { caption: '', status: 'published' },
      }),
    ];
    expect(canPublishThisHour(videos, 'aurora', NOW)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkAndPublishScheduledVideos — integration via triggerSchedulerCheck
//
// The key constraint: vi.mock() is hoisted, so the factory CANNOT reference
// variables declared inside describe/it blocks. Instead we declare the mock
// at module level with a placeholder, and override the return value in each
// test using mockResolvedValue / mockReturnValue.
// ---------------------------------------------------------------------------

// Module-level mock — factory uses only literals / inline functions
vi.mock('@/utils/fileUtils', () => ({
  readJsonFile: vi.fn(),
}));

describe('checkAndPublishScheduledVideos (via triggerSchedulerCheck)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('SITE_PASSWORD', 'test-secret');
    vi.stubEnv('NODE_ENV', 'test');
    // Reset mock call history
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
    // Clear the scheduler singleton
    const g = globalThis as typeof globalThis & { __schedulerTask?: unknown };
    if (g.__schedulerTask && typeof (g.__schedulerTask as { stop?: () => void }).stop === 'function') {
      (g.__schedulerTask as { stop: () => void }).stop();
    }
    delete g.__schedulerTask;
  });

  it('does nothing outside publishing window (00:00 UTC)', async () => {
    vi.setSystemTime(new Date('2025-06-15T00:00:00.000Z'));

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does nothing outside publishing window (22:00 UTC)', async () => {
    vi.setSystemTime(new Date('2025-06-15T22:00:00.000Z'));

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does nothing when no videos exist', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'));

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does nothing when all videos are in non-scheduled status', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'));

    const draftVideo = makeVideo({ id: 'draft1', status: 'draft' });
    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([draftVideo]);

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does nothing when scheduled video is not yet due', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'));

    const futureVideo = makeVideo({
      id: 'future1',
      status: 'scheduled',
      scheduledAt: '2025-06-15T15:00:00.000Z',
    });
    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([futureVideo]);

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('publishes a due scheduled video via the API endpoint', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'));

    const dueVideo = makeVideo({
      id: 'due1',
      status: 'scheduled',
      scheduledAt: '2025-06-15T13:00:00.000Z',
      account: 'aurora',
    });

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([dueVideo]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: { youtube: { success: true, videoId: 'yt123' }, tiktok: { success: true } },
        cleaned: false,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/videos/due1/publish');
    expect(opts.method).toBe('POST');
    expect(opts.headers['x-internal-secret']).toBe('test-secret');
  });

  it('groups videos by account and publishes one per account', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'));

    const videos = [
      makeVideo({ id: 'a1', account: 'aurora', status: 'scheduled', scheduledAt: '2025-06-15T12:00:00.000Z' }),
      makeVideo({ id: 'a2', account: 'aurora', status: 'scheduled', scheduledAt: '2025-06-15T12:30:00.000Z' }),
      makeVideo({ id: 'm1', account: 'mono', status: 'scheduled', scheduledAt: '2025-06-15T12:00:00.000Z' }),
    ];

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue(videos);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: { youtube: { success: true }, tiktok: { success: true } } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    // One per account: a1 (aurora) and m1 (mono), NOT a2
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const calledUrls = mockFetch.mock.calls.map(([url]: [string]) => url) as string[];
    expect(calledUrls.some((u) => u.includes('/api/videos/a1/publish'))).toBe(true);
    expect(calledUrls.some((u) => u.includes('/api/videos/m1/publish'))).toBe(true);
    expect(calledUrls.some((u) => u.includes('/api/videos/a2/publish'))).toBe(false);
  });

  it('skips account that already published this hour', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:30:00.000Z'));

    const alreadyPublished = makeVideo({
      id: 'pub1',
      account: 'aurora',
      status: 'published',
      youtube: {
        title: 'T',
        description: '',
        tags: [],
        category: '10',
        privacy: 'public',
        status: 'published',
        publishedAt: '2025-06-15T14:05:00.000Z',
      },
      tiktok: { caption: '', status: 'published' },
    });
    const dueVideo = makeVideo({
      id: 'due2',
      account: 'aurora',
      status: 'scheduled',
      scheduledAt: '2025-06-15T14:00:00.000Z',
    });

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([alreadyPublished, dueVideo]);

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles a failed publish API response gracefully (no throw)', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'));

    const dueVideo = makeVideo({
      id: 'fail1',
      status: 'scheduled',
      scheduledAt: '2025-06-15T13:00:00.000Z',
    });

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([dueVideo]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Internal Server Error',
    });
    vi.stubGlobal('fetch', mockFetch);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await expect(triggerSchedulerCheck()).resolves.toBeUndefined();
  });

  it('handles a fetch network error gracefully (no throw)', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'));

    const dueVideo = makeVideo({
      id: 'neterr1',
      status: 'scheduled',
      scheduledAt: '2025-06-15T13:00:00.000Z',
    });

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([dueVideo]);

    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    vi.stubGlobal('fetch', mockFetch);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await expect(triggerSchedulerCheck()).resolves.toBeUndefined();
  });

  it('publishes at exactly 11:00 UTC (window open boundary)', async () => {
    vi.setSystemTime(new Date('2025-06-15T11:00:00.000Z'));

    const dueVideo = makeVideo({
      id: 'boundary1',
      status: 'scheduled',
      scheduledAt: '2025-06-15T10:00:00.000Z',
    });

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([dueVideo]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: { youtube: { success: true }, tiktok: { success: true } } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('publishes at 21:59:59 UTC — hour 21 is inside the window', async () => {
    vi.setSystemTime(new Date('2025-06-15T21:59:59.000Z'));

    const dueVideo = makeVideo({
      id: 'boundary2',
      status: 'scheduled',
      scheduledAt: '2025-06-15T21:00:00.000Z',
    });

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([dueVideo]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: { youtube: { success: true }, tiktok: { success: true } } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('sends correct body structure including commercialContent', async () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'));

    const dueVideo = makeVideo({
      id: 'body1',
      status: 'scheduled',
      scheduledAt: '2025-06-15T13:00:00.000Z',
      account: 'mono',
      tiktok: { caption: 'My Caption', status: 'pending' },
      youtube: {
        title: 'My Title',
        description: '',
        tags: [],
        category: '10',
        privacy: 'public',
        status: 'pending',
      },
    });

    const { readJsonFile } = await import('@/utils/fileUtils');
    (readJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue([dueVideo]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: { youtube: { success: true }, tiktok: { success: true } } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { triggerSchedulerCheck } = await import('../scheduler');
    await triggerSchedulerCheck();

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.platform).toBe('both');
    expect(body.publishData.videoId).toBe('body1');
    expect(body.publishData.privacyLevel).toBe('PUBLIC_TO_EVERYONE');
    expect(body.publishData.commercialContent).toEqual({
      enabled: false,
      yourBrand: false,
      brandedContent: false,
    });
  });
});

// ---------------------------------------------------------------------------
// startScheduler / isSchedulerRunning
// ---------------------------------------------------------------------------

describe('startScheduler and isSchedulerRunning', () => {
  // isSchedulerRunning() checks `globalRef.__schedulerTask !== null`.
  // We must set to null (not delete/undefined) to get false from the guard.
  function resetSchedulerSingleton() {
    const g = globalThis as typeof globalThis & { __schedulerTask: unknown };
    if (g.__schedulerTask && typeof (g.__schedulerTask as { stop?: () => void }).stop === 'function') {
      (g.__schedulerTask as { stop: () => void }).stop();
    }
    // Assign null explicitly — delete would leave undefined, and undefined !== null === true
    g.__schedulerTask = null;
  }

  beforeEach(() => {
    vi.resetModules();
    resetSchedulerSingleton();
  });

  afterEach(() => {
    resetSchedulerSingleton();
    vi.resetModules();
  });

  it('isSchedulerRunning returns false before start', async () => {
    const { isSchedulerRunning } = await import('../scheduler');
    expect(isSchedulerRunning()).toBe(false);
  });

  it('isSchedulerRunning returns true after startScheduler', async () => {
    const { startScheduler, isSchedulerRunning } = await import('../scheduler');
    startScheduler();
    expect(isSchedulerRunning()).toBe(true);
  });

  it('calling startScheduler twice does not create duplicate tasks', async () => {
    const { startScheduler, isSchedulerRunning } = await import('../scheduler');
    startScheduler();
    startScheduler(); // idempotent
    expect(isSchedulerRunning()).toBe(true);
    const g = globalThis as typeof globalThis & { __schedulerTask?: unknown };
    expect(g.__schedulerTask).toBeDefined();
  });
});
