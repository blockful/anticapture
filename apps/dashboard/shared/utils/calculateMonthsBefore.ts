import {
  DAYS_PER_MONTH,
  MILLISECONDS_PER_DAY,
} from "@/shared/constants/time-related";

export const calculateMonthsBefore = ({
  timestamp,
  monthsBeforeTimestamp,
}: {
  timestamp: number;
  monthsBeforeTimestamp: number;
}): number => {
  const MILLISECONDS_TO_SUBTRACT =
    monthsBeforeTimestamp * DAYS_PER_MONTH * MILLISECONDS_PER_DAY;
  return timestamp - MILLISECONDS_TO_SUBTRACT;
};
