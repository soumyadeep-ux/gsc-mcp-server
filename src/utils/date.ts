/**
 * Gets a date string in YYYY-MM-DD format
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Gets the date N days ago
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Gets the default start date (28 days ago)
 */
export function getDefaultStartDate(): string {
  return formatDate(daysAgo(28));
}

/**
 * Gets the default end date (today)
 */
export function getDefaultEndDate(): string {
  return formatDate(new Date());
}

/**
 * Validates a date string in YYYY-MM-DD format
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Parses a date range, using defaults if not provided
 */
export function parseDateRange(
  startDate?: string,
  endDate?: string
): { startDate: string; endDate: string } {
  return {
    startDate: startDate ?? getDefaultStartDate(),
    endDate: endDate ?? getDefaultEndDate(),
  };
}
