import { calculateDaysDiff } from "@/features/governance/utils/calculateDaysDiff";

// Helper function to calculate hours difference
const calculateHoursDiff = (timestamp: string, currentTime: number): number => {
  const diffSeconds = Math.abs(parseInt(timestamp) - currentTime);
  return Math.floor(diffSeconds / (60 * 60));
};

export const getTimeText = (startTimestamp: string, endTimestamp: string) => {
  const now = Date.now() / 1000;
  const startTime = parseInt(startTimestamp);
  const endTime = parseInt(endTimestamp);

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
