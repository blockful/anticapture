import { SECONDS_PER_DAY } from "@/shared/constants/time-related";
import { timestampToReadableDate } from "@/shared/utils";

export const getDateRange = (days: string) => {
  if (!days) return "";

  const numDays = parseInt(days.replace("d", ""));

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endTimestamp = Math.floor(now.getTime() / 1000);

  const startTimestamp = endTimestamp - numDays * SECONDS_PER_DAY;

  return `${timestampToReadableDate(startTimestamp)} - ${timestampToReadableDate(endTimestamp)}`;
};
