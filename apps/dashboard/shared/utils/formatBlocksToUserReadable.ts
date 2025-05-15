import { formatPlural } from "@/shared/utils";
import {
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from "@/shared/constants/time-related";

export function formatBlocksToUserReadable(
  num: number,
  useAbbreviations: boolean = false,
): string {
  // Constants
  const SECONDS_PER_BLOCK = 12;

  // Handle zero or negative blocks
  if (num <= 0) return "0 sec";

  // Convert blocks to seconds
  const totalSeconds = num * SECONDS_PER_BLOCK;

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
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = Math.round(totalSeconds % SECONDS_PER_MINUTE);

  const parts = [];

  // Add hours if we have any
  if (hours > 0) {
    parts.push(useAbbreviations ? `${hours}h` : formatPlural(hours, "hour"));
  }

  // Add minutes if we have any
  if (minutes > 0) {
    parts.push(
      useAbbreviations ? `${minutes}min` : formatPlural(minutes, "min"),
    );
  }

  // Add seconds only if we have no hours and minutes
  if (parts.length === 0 && seconds > 0) {
    parts.push(useAbbreviations ? `${seconds}s` : formatPlural(seconds, "sec"));
  }

  return parts.join(useAbbreviations ? " " : ", ");
}
