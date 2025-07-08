export function formatNumberUserReadable(
  num: number,
  fixed: number = 2,
): string {
  const format = (value: number, suffix: string) =>
    value.toFixed(fixed).replace(/\.?0+$/, "") + suffix;

  if (num >= 1e9) return format(num / 1e9, "B"); // Billion
  if (num >= 1e6) return format(num / 1e6, "M"); // Million
  if (num >= 1e3) return format(num / 1e3, "K"); // Thousand
  return num.toFixed(fixed).replace(/\.?0+$/, "");
}
