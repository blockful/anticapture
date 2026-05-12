export const formatCompact = (value: number) => {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${abs / 1_000_000}M`;
  if (abs >= 1_000) return `${sign}${abs / 1_000}K`;
  return String(value);
};

export const formatMillions = (value: number) => {
  if (value === 0) return "$0";
  return `$${value / 1_000_000}M`;
};
