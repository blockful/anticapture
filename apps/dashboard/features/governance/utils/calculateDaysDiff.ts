// Helper function to calculate days difference
export const calculateDaysDiff = (
  timestamp: string,
  currentTime: number,
): number => {
  const diffSeconds = Math.abs(parseInt(timestamp) - currentTime);
  return Math.floor(diffSeconds / (24 * 60 * 60));
};
