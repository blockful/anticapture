const format = (value: number, suffix: string, fixed: number) =>
  value.toFixed(fixed).replace(/\.?0+$/, "") + suffix;

export function formatNumberUserReadable(
  num: number,
  fixed: number = 2,
): string {
  if (num >= 1e9) return format(num / 1e9, "B", fixed); // Billion
  if (num >= 1e6) return format(num / 1e6, "M", fixed); // Million
  if (num >= 1e3) return format(num / 1e3, "K", fixed); // Thousand
  return Number(num)
    .toFixed(fixed)
    .replace(/\.?0+$/, "");
}
