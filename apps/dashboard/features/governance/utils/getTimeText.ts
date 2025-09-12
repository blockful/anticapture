import { calculateDaysDiff } from "@/features/governance/utils/calculateDaysDiff";

export const getTimeText = (startTimestamp: string, endTimestamp: string) => {
  const now = Date.now() / 1000;
  const startTime = parseInt(startTimestamp);
  const endTime = parseInt(endTimestamp);

  if (startTime > now) {
    const days = calculateDaysDiff(startTimestamp, now);
    return `${days}d to start`;
  } else if (endTime > now) {
    const days = calculateDaysDiff(endTimestamp, now);
    return `${days}d left`;
  } else {
    const days = calculateDaysDiff(endTimestamp, now);
    return `${days}d ago`;
  }
};
