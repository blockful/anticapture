// Helper function to calculate days difference
export const calculateDaysDiff = (
  timestamp: number | string,
  currentTime: number,
): number => {
  const diffSeconds = Math.abs(Number(timestamp) - currentTime);
  return Math.floor(diffSeconds / (24 * 60 * 60));
};
