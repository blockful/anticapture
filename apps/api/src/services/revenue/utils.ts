export const DUNE_MONTH_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\s+UTC$/;

/**
 * The regex fixes the digit widths; this fixes the calendar. `Date.UTC`
 * rolls month 13 or February 31 into the next month without complaint, and a
 * row like that would be cached for a day under a timestamp Dune never sent.
 */
export function isValidDuneMonth(s: string): boolean {
  const match = DUNE_MONTH_REGEX.exec(s.trim());
  if (!match) return false;
  // Every group is mandatory in the regex, so a missing one is unreachable;
  // NaN keeps the arithmetic honest anyway and fails the round trip below.
  const at = (index: number): number => Number(match[index] ?? Number.NaN);
  const year = at(1);
  const month = at(2);
  const day = at(3);
  if (at(4) > 23 || at(5) > 59 || at(6) > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

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
