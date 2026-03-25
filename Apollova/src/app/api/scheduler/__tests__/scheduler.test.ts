// src/app/api/scheduler/__tests__/scheduler.test.ts
//
// Integration tests for:
//   GET /api/scheduler/start  — starts the background cron (idempotent)
//   GET /api/scheduler/check  — manually triggers a scheduler check
//
// The route handlers are thin wrappers around two utility functions from
// @/utils/scheduler.  We mock the entire scheduler module so we never touch
// node-cron, the filesystem, or outbound fetch calls.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mock — must appear before any imports that pull in the routes
// ---------------------------------------------------------------------------

vi.mock('@/utils/scheduler', () => ({
  startScheduler: vi.fn(),
  isSchedulerRunning: vi.fn(),
  triggerSchedulerCheck: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Route imports
// ---------------------------------------------------------------------------

import { GET as startRoute } from '../start/route';
import { GET as checkRoute } from '../check/route';
import { startScheduler, isSchedulerRunning, triggerSchedulerCheck } from '@/utils/scheduler';

const mockStartScheduler = vi.mocked(startScheduler);
const mockIsSchedulerRunning = vi.mocked(isSchedulerRunning);
const mockTriggerSchedulerCheck = vi.mocked(triggerSchedulerCheck);

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// /api/scheduler/start
// ---------------------------------------------------------------------------

describe('GET /api/scheduler/start', () => {
  it('returns status:started when scheduler was not running', async () => {
    mockIsSchedulerRunning.mockReturnValue(false);
    mockStartScheduler.mockReturnValue(undefined);

    const res = await startRoute();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('started');
    expect(body.message).toMatch(/started successfully/i);
  });

  it('calls startScheduler() exactly once when not already running', async () => {
    mockIsSchedulerRunning.mockReturnValue(false);
    mockStartScheduler.mockReturnValue(undefined);

    await startRoute();

    expect(mockStartScheduler).toHaveBeenCalledOnce();
  });

  it('returns status:already_running when scheduler is already active', async () => {
    mockIsSchedulerRunning.mockReturnValue(true);

    const res = await startRoute();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('already_running');
    expect(body.message).toMatch(/already running/i);
  });

  it('does NOT call startScheduler() when already running', async () => {
    mockIsSchedulerRunning.mockReturnValue(true);

    await startRoute();

    expect(mockStartScheduler).not.toHaveBeenCalled();
  });

  it('returns 500 with status:error when startScheduler throws', async () => {
    mockIsSchedulerRunning.mockReturnValue(false);
    mockStartScheduler.mockImplementation(() => {
      throw new Error('cron init failed');
    });

    const res = await startRoute();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.status).toBe('error');
    expect(body.message).toBe('cron init failed');
  });

  it('includes schedule description in success response', async () => {
    mockIsSchedulerRunning.mockReturnValue(false);
    mockStartScheduler.mockReturnValue(undefined);

    const res = await startRoute();
    const body = await res.json();

    expect(body.schedule).toBeDefined();
    expect(typeof body.schedule).toBe('string');
  });

  it('includes dailySchedule description in success response', async () => {
    mockIsSchedulerRunning.mockReturnValue(false);
    mockStartScheduler.mockReturnValue(undefined);

    const res = await startRoute();
    const body = await res.json();

    expect(body.dailySchedule).toBeDefined();
    expect(typeof body.dailySchedule).toBe('string');
  });

  it('is safe to call multiple times (idempotent via already_running guard)', async () => {
    // First call: scheduler starts
    mockIsSchedulerRunning.mockReturnValueOnce(false);
    const firstRes = await startRoute();
    const firstBody = await firstRes.json();
    expect(firstBody.status).toBe('started');

    // Second call: scheduler is now running
    mockIsSchedulerRunning.mockReturnValueOnce(true);
    const secondRes = await startRoute();
    const secondBody = await secondRes.json();
    expect(secondBody.status).toBe('already_running');

    // startScheduler was only called once
    expect(mockStartScheduler).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// /api/scheduler/check
// ---------------------------------------------------------------------------

describe('GET /api/scheduler/check', () => {
  it('returns status:success when triggerSchedulerCheck resolves', async () => {
    mockTriggerSchedulerCheck.mockResolvedValue(undefined);

    const res = await checkRoute();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.message).toMatch(/completed/i);
  });

  it('calls triggerSchedulerCheck() exactly once', async () => {
    mockTriggerSchedulerCheck.mockResolvedValue(undefined);

    await checkRoute();

    expect(mockTriggerSchedulerCheck).toHaveBeenCalledOnce();
  });

  it('returns 500 with status:error when triggerSchedulerCheck throws', async () => {
    mockTriggerSchedulerCheck.mockRejectedValue(new Error('DB read failed'));

    const res = await checkRoute();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.status).toBe('error');
    expect(body.message).toBe('DB read failed');
  });

  it('returns 500 with generic message when error is not an Error instance', async () => {
    mockTriggerSchedulerCheck.mockRejectedValue('string error');

    const res = await checkRoute();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Unknown error');
  });

  it('awaits the check before responding (async completion)', async () => {
    let resolved = false;
    mockTriggerSchedulerCheck.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 0));
      resolved = true;
    });

    const res = await checkRoute();
    await res.json();

    expect(resolved).toBe(true);
  });

  it('returns 200 status code on success (not 201 or other codes)', async () => {
    mockTriggerSchedulerCheck.mockResolvedValue(undefined);

    const res = await checkRoute();

    expect(res.status).toBe(200);
  });
});
