import { formatPlural } from "@/shared/utils";
import {
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from "@/shared/constants/time-related";

export function formatBlocksToUserReadable(
  num: number,
  blockTime: number,
  useAbbreviations: boolean = false,
): string {
  // Handle zero or negative blocks
  if (num <= 0) return "0 sec";

  // Convert blocks to seconds
  const totalSeconds = num * blockTime;

  // For small block counts, just show seconds
  if (num < 5) {
    return formatPlural(Math.round(totalSeconds), "sec");
  }

  return formatSecondsToReadable(totalSeconds, useAbbreviations);
}

// Helper function to convert seconds to a readable time format with optional abbreviations
export function formatSecondsToReadable(
  totalSeconds: number,
  useAbbreviations: boolean = false,
): string {
  const days = Math.floor(totalSeconds / (SECONDS_PER_HOUR * 24));
  const hours = Math.floor(
    (totalSeconds % (SECONDS_PER_HOUR * 24)) / SECONDS_PER_HOUR,
  );
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = Math.round(totalSeconds % SECONDS_PER_MINUTE);

  const parts = [];

  if (days > 0) {
    parts.push(useAbbreviations ? `${days}d` : formatPlural(days, "day"));
  }

  if (hours > 0) {
    parts.push(useAbbreviations ? `${hours}h` : formatPlural(hours, "hour"));
  }

  if (minutes > 0) {
    parts.push(
      useAbbreviations ? `${minutes}min` : formatPlural(minutes, "min"),
    );
  }

  if (parts.length === 0 && seconds > 0) {
    parts.push(useAbbreviations ? `${seconds}s` : formatPlural(seconds, "sec"));
  }

  return parts.join(useAbbreviations ? " " : ", ");
}
