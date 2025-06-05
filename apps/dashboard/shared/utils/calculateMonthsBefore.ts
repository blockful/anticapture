import {
  DAYS_PER_MONTH,
  SECONDS_PER_DAY,
} from "@/shared/constants/time-related";

export const calculateMonthsBefore = ({
  timestamp,
  monthsBeforeTimestamp,
}: {
  timestamp: number;
  monthsBeforeTimestamp: number;
}): number => {
  const SECONDS_TO_SUBTRACT =
    monthsBeforeTimestamp * DAYS_PER_MONTH * SECONDS_PER_DAY;
  return timestamp - SECONDS_TO_SUBTRACT;
};
