const DUNE_MONTH_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\s+UTC$/;

export function parseDuneMonth(s: string): number {
  const match = DUNE_MONTH_REGEX.exec(s.trim());
  if (!match) {
    throw new Error(`Invalid Dune month format: ${s}`);
  }
  const [, year, month, day, hour, minute, second] = match;
  const ms = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return Math.floor(ms / 1000);
}

export function filterByRange<T extends { date: number }>(
  items: T[],
  fromDate: number | undefined,
  toDate: number | undefined,
): T[] {
  return items.filter(
    (item) =>
      (fromDate == null || item.date >= fromDate) &&
      (toDate == null || item.date <= toDate),
  );
}
