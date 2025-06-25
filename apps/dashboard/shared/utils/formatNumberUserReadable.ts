export function formatNumberUserReadable(
  num: number,
  fixed: number = 2,
): string {
  const format = (value: number, suffix: string) =>
    value.toFixed(fixed).replace(/\.?0+$/, "") + suffix;

  if (num >= 1e18) return format(num / 1e18, "E"); // Quintillion
  if (num >= 1e15) return format(num / 1e15, "Q"); // Quadrillion
  if (num >= 1e12) return format(num / 1e12, "T"); // Trillion
  if (num >= 1e9) return format(num / 1e9, "B"); // Billion
  if (num >= 1e6) return format(num / 1e6, "M"); // Million
  if (num >= 1e3) return format(num / 1e3, "K"); // Thousand
  return num.toFixed(fixed).replace(/\.?0+$/, "");
}
