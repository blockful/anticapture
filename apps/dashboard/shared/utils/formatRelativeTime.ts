const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30; // Approximate - used for display purposes only
const DAYS_PER_YEAR = 365;

interface FormatRelativeTimeOptions {
  // If true, skips months and weeks, showing days until 1 year (e.g., "40 days ago", "200 days ago")
  skipMonthsAndWeeks?: boolean;
}

// - Converts timestamp from seconds to milliseconds for Date object
// - Returns granularity from years down to minutes
// - Uses approximate month calculation (30 days) for simplicity
// - Returns "Just now" for timestamps less than a minute ago

// Example: formatRelativeTime(1706889600) // "1 month ago"
// Example: formatRelativeTime(1706889600, { skipMonthsAndWeeks: true }) // "40 days ago" instead of "1 month ago"

export function formatRelativeTime(
  timestampSeconds: number | string,
  options: FormatRelativeTimeOptions = {},
): string {
  const { skipMonthsAndWeeks = false } = options;

  const timestamp =
    typeof timestampSeconds === "string"
      ? parseInt(timestampSeconds, 10)
      : timestampSeconds;

  const date = new Date(timestamp * MILLISECONDS_PER_SECOND);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const diffInSeconds = Math.floor(diffInMs / MILLISECONDS_PER_SECOND);
  const diffInMinutes = Math.floor(diffInSeconds / SECONDS_PER_MINUTE);
  const diffInHours = Math.floor(diffInMinutes / MINUTES_PER_HOUR);
  const diffInDays = Math.floor(diffInHours / HOURS_PER_DAY);
  const diffInWeeks = Math.floor(diffInDays / DAYS_PER_WEEK);
  const diffInMonths = Math.floor(diffInDays / DAYS_PER_MONTH);
  const diffInYears = Math.floor(diffInDays / DAYS_PER_YEAR);

  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  }

  if (skipMonthsAndWeeks) {
    // Skip months and weeks, show days directly
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  } else {
    // Original behavior with months and weeks
    if (diffInMonths > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    }
    if (diffInWeeks > 0) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    }
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  }

  if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}
