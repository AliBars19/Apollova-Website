// src/instrumentation.ts
// Runs once when the Next.js server starts.
// Starts the scheduler automatically so no manual /api/scheduler/start visit is needed.

let started = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !started) {
    started = true;
    const { startScheduler } = await import('@/utils/scheduler');
    startScheduler();
  }
}
