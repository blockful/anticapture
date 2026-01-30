const format = (value: number, suffix: string, fixed: number) =>
  value
    .toFixed(fixed)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "") + suffix;

export function formatNumberUserReadable(
  num: number,
  fixed: number = 2,
): string {
  if (num >= 1e9) return format(num / 1e9, "B", fixed); // Billion
  if (num >= 1e6) return format(num / 1e6, "M", fixed); // Million
  if (num >= 1e3) return format(num / 1e3, "K", fixed); // Thousand
  
  const result = Number(num).toFixed(fixed);
  // Only remove trailing zeros after decimal point, not the whole number
  return result.includes(".") ? result.replace(/\.?0+$/, "") : result;
}
