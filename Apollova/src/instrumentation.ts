// src/instrumentation.ts
// Runs once when the Next.js server starts.
// Starts the scheduler automatically so no manual /api/scheduler/start visit is needed.

let started = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !started) {
    started = true;
    try {
      const { startScheduler } = await import('@/utils/scheduler');
      startScheduler();
      console.log('[instrumentation] Scheduler auto-started on server boot');
    } catch (error) {
      started = false;
      console.error('[instrumentation] Failed to start scheduler:', error);
    }
  }
}
