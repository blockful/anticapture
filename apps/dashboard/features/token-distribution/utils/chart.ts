export const normalizeTimestamp = (timestamp: number | string): number => {
  const ts = Number(timestamp);
  const seconds = ts > 1e12 ? Math.floor(ts / 1000) : ts;
  return Math.floor(seconds / 86400) * 86400;
};
