import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateDailySchedule, getNextAvailableSlot } from '../schedulerHelper';

describe('generateDailySchedule', () => {
  it('returns 12 slots', () => {
    const schedule = generateDailySchedule(new Date('2025-06-15'));
    expect(schedule).toHaveLength(12);
  });

  it('all slots are valid ISO strings', () => {
    const schedule = generateDailySchedule(new Date('2025-06-15'));
    for (const slot of schedule) {
      expect(() => new Date(slot)).not.toThrow();
      expect(new Date(slot).toISOString()).toBe(slot);
    }
  });

  it('first slot starts at hour 11', () => {
    const schedule = generateDailySchedule(new Date('2025-06-15'));
    const first = new Date(schedule[0]);
    expect(first.getHours()).toBe(11);
  });

  it('last slot at hour 22', () => {
    const schedule = generateDailySchedule(new Date('2025-06-15'));
    const last = new Date(schedule[11]);
    expect(last.getHours()).toBe(22);
  });

  it('slots are 1 hour apart', () => {
    const schedule = generateDailySchedule(new Date('2025-06-15'));
    for (let i = 1; i < schedule.length; i++) {
      const diff = new Date(schedule[i]).getTime() - new Date(schedule[i - 1]).getTime();
      expect(diff).toBe(3600000); // 1 hour in ms
    }
  });

  it('uses correct date', () => {
    const date = new Date('2025-12-25');
    const schedule = generateDailySchedule(date);
    const first = new Date(schedule[0]);
    expect(first.getDate()).toBe(25);
    expect(first.getMonth()).toBe(11); // December
  });
});

describe('getNextAvailableSlot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns future slot', () => {
    vi.setSystemTime(new Date('2025-06-15T10:00:00'));
    const slot = getNextAvailableSlot();
    expect(slot).not.toBeNull();
    expect(new Date(slot!).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns null when all slots passed', () => {
    vi.setSystemTime(new Date('2025-06-15T23:30:00'));
    const slot = getNextAvailableSlot();
    expect(slot).toBeNull();
  });

  it('first available slot at 11:00', () => {
    vi.setSystemTime(new Date('2025-06-15T08:00:00'));
    const slot = getNextAvailableSlot();
    expect(slot).not.toBeNull();
    const d = new Date(slot!);
    expect(d.getHours()).toBe(11);
  });
});
