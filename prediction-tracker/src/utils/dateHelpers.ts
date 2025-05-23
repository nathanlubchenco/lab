/**
 * Calculate the number of days remaining until the target date.
 * @param targetDate ISO date string of target date.
 * @returns Number of days between today and target date. If past, returns 0.
 */
export function calculateDaysRemaining(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = target.getTime() - now.getTime();
  return diff > 0 ? Math.ceil(diff / msPerDay) : 0;
}