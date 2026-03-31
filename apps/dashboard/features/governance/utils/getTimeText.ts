import { calculateDaysDiff } from "@/features/governance/utils/calculateDaysDiff";

// Helper function to calculate remaining hours after accounting for full days
const calculateRemainingHours = (
  timestamp: number | string,
  currentTime: number,
): number => {
  const diffSeconds = Math.abs(Number(timestamp) - currentTime);
  const remainingSeconds = diffSeconds % (24 * 60 * 60);
  return Math.floor(remainingSeconds / (60 * 60));
};

// Helper function to format time with days and hours
const formatDaysAndHours = (days: number, hours: number): string => {
  if (days === 0) {
    return `${hours}H`;
  } else if (hours === 0) {
    return `${days}D`;
  } else {
    return `${days}D ${hours}H`;
  }
};

export const getTimeLeftText = (endTimestamp: number | string) => {
  const now = Date.now() / 1000;
  const endTime = Number(endTimestamp);

  if (endTime > now) {
    const days = calculateDaysDiff(endTimestamp, now);
    const hours = calculateRemainingHours(endTimestamp, now);
    const timeText = formatDaysAndHours(days, hours);
    return `Voting closes in ${timeText}`;
  } else if (endTime < now) {
    const days = calculateDaysDiff(endTimestamp, now);
    const hours = calculateRemainingHours(endTimestamp, now);
    const timeText = formatDaysAndHours(days, hours);
    return `Voting closed ${timeText} ago`;
  } else {
    const days = calculateDaysDiff(endTimestamp, now);
    const hours = calculateRemainingHours(endTimestamp, now);
    const timeText = formatDaysAndHours(days, hours);
    return `Voting closed ${timeText} ago`;
  }
};

// Helper function to calculate hours difference (for getTimeText function)
const calculateHoursDiff = (
  timestamp: number | string,
  currentTime: number,
): number => {
  const diffSeconds = Math.abs(Number(timestamp) - currentTime);
  return Math.floor(diffSeconds / (60 * 60));
};

export const getTimeText = (
  startTimestamp: number | string,
  endTimestamp: number | string,
) => {
  const now = Date.now() / 1000;
  const startTime = Number(startTimestamp);
  const endTime = Number(endTimestamp);

  if (startTime > now) {
    const days = calculateDaysDiff(startTimestamp, now);
    if (days === 0) {
      const hours = calculateHoursDiff(startTimestamp, now);
      return `${hours}h to start`;
    }
    return `${days}d to start`;
  } else if (endTime > now) {
    const days = calculateDaysDiff(endTimestamp, now);
    if (days === 0) {
      const hours = calculateHoursDiff(endTimestamp, now);
      return `${hours}h left`;
    }
    return `${days}d left`;
  } else {
    const days = calculateDaysDiff(endTimestamp, now);
    if (days === 0) {
      const hours = calculateHoursDiff(endTimestamp, now);
      return `${hours}h ago`;
    }
    return `${days}d ago`;
  }
};
