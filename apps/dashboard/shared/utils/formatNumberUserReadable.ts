export function formatNumberUserReadable(
  num: number,
  fixed: number = 2,
): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(fixed).replace(/\.0$/, "") + "B";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(fixed).replace(/\.0$/, "") + "M";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(fixed).replace(/\.0$/, "") + "K";
  }
  return num.toFixed(fixed).toString();
}
