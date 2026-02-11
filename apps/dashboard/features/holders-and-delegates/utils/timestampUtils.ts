import { TimePeriod } from "@/features/holders-and-delegates/components/TimePeriodSwitcher";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";

interface TimestampRange {
  fromTimestamp: number | undefined;
  toTimestamp: number | undefined;
}

export function getTimestampRangeFromPeriod(
  selectedPeriod: TimePeriod,
): TimestampRange {
  if (selectedPeriod === "all") {
    return { fromTimestamp: undefined, toTimestamp: undefined };
  }

  const nowInSeconds = Date.now() / 1000;
  const daysInSeconds =
    selectedPeriod === "90d" ? 90 * SECONDS_PER_DAY : 30 * SECONDS_PER_DAY;

  return {
    fromTimestamp: Math.floor(nowInSeconds - daysInSeconds),
    toTimestamp: Math.floor(nowInSeconds),
  };
}
