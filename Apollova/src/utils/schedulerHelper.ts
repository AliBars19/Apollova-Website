// src/utils/scheduleHelper.ts

/**
 * Generates an array of 12 scheduled times from 11 AM to 11 PM (hourly)
 * for a given date
 */
export function generateDailySchedule(date: Date = new Date()): string[] {
  const scheduledTimes: string[] = [];
  
  // Set the date to 11 AM (hour 11)
  const baseTime = new Date(date);
  baseTime.setHours(11, 0, 0, 0); // 11:00:00 AM
  
  // Generate 12 hourly slots (11 AM through 11 PM)
  for (let i = 0; i < 12; i++) {
    const scheduledTime = new Date(baseTime);
    scheduledTime.setHours(11 + i); // 11, 12, 13, ..., 22 (11 PM)
    
    scheduledTimes.push(scheduledTime.toISOString());
  }
  
  return scheduledTimes;
}

/**
 * Example usage:
 * 
 * const today = new Date();
 * const schedule = generateDailySchedule(today);
 * 
 * Returns:
 * [
 *   "2024-12-24T11:00:00.000Z",  // 11 AM
 *   "2024-12-24T12:00:00.000Z",  // 12 PM
 *   "2024-12-24T13:00:00.000Z",  // 1 PM
 *   ... up to
 *   "2024-12-24T23:00:00.000Z"   // 11 PM
 * ]
 */

/**
 * Formats a scheduled time for display
 */
export function formatScheduledTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Gets the next available time slot for today
 */
export function getNextAvailableSlot(): string | null {
  const now = new Date();
  const schedule = generateDailySchedule(now);
  
  // Find the first time slot that's in the future
  for (const slot of schedule) {
    if (new Date(slot) > now) {
      return slot;
    }
  }
  
  // If all slots are taken for today, return null
  return null;
}

/**
 * Example: Schedule videos for tomorrow
 */
export function scheduleTomorrow(): string[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return generateDailySchedule(tomorrow);
}