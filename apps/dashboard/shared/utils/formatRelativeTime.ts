const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;

// - Converts timestamp from seconds to milliseconds for Date object
// - Returns granularity from years down to minutes
// - Skips months and weeks, showing days directly (e.g., "40 days ago", "200 days ago")
// - Returns "Just now" for timestamps less than a minute ago

// Example: formatRelativeTime(1706889600) // "40 days ago"

export function formatRelativeTime(timestampSeconds: number | string): string {
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
  const diffInYears = Math.floor(diffInDays / DAYS_PER_YEAR);

  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  }

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

// Formats timestamp in seconds to "YYYY-MM-DD HH:MM:SS" format
export function formatFullDate(timestampSeconds: number | string): string {
  const timestamp =
    typeof timestampSeconds === "string"
      ? parseInt(timestampSeconds, 10)
      : timestampSeconds;

  const date = new Date(timestamp * MILLISECONDS_PER_SECOND);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
