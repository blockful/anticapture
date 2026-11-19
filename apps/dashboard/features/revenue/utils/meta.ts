/**
 * Freshness metadata the revenue API attaches to every `/revenue/*` response:
 * `meta: { asOf: string | null, degraded: boolean }`. The generated client
 * types predate it, so it is read defensively from the raw payload.
 */
export type RevenueMeta = {
  /** When the rows served were computed (data cutoff). Null when unknown. */
  asOf: Date | null;
  /** True when the API served a stale copy or an empty fallback. */
  degraded: boolean;
  /** False for responses from an API that does not send `meta` yet. */
  reported: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function readRevenueMeta(data: unknown): RevenueMeta {
  const meta = isRecord(data) ? data.meta : undefined;
  if (!isRecord(meta)) return { asOf: null, degraded: false, reported: false };
  return {
    asOf: parseDate(meta.asOf),
    degraded: meta.degraded === true,
    reported: true,
  };
}

/**
 * Cutoff of a series without `asOf`, inferred from its rows: the data reaches
 * into the latest row's month but may stop anywhere in it, so that month is
 * treated as partial (the cutoff is its last instant, or now if earlier).
 * Null when no row is dated up to now.
 */
export function inferCutoffFromRows(
  items: unknown[],
  now: Date = new Date(),
): Date | null {
  let latest: number | null = null;
  for (const item of items) {
    if (!isRecord(item) || typeof item.date !== "number") continue;
    if (item.date * 1000 > now.getTime()) continue;
    if (latest === null || item.date > latest) latest = item.date;
  }
  if (latest === null) return null;
  const latestMonth = new Date(latest * 1000);
  const monthEnd =
    Date.UTC(latestMonth.getUTCFullYear(), latestMonth.getUTCMonth() + 1, 1) -
    1;
  return new Date(Math.min(monthEnd, now.getTime()));
}

/**
 * Without `asOf`, where the cutoff comes from: the series' own rows, or the
 * viewer's clock for series whose rows are not dated by when they happened
 * (renewal tenure is keyed by future expiry months).
 */
export type CutoffFallback = "rows" | "clock";

/**
 * The instant the data runs up to: `asOf`, else inferred from `rows`, else the
 * viewer's clock. The clock alone would make every month after frozen data
 * count as $0 and treat a partial latest month as complete.
 */
export function resolveDataCutoff(
  meta: RevenueMeta,
  now: Date = new Date(),
  rows?: unknown[],
): Date {
  if (meta.asOf) return meta.asOf;
  return (rows ? inferCutoffFromRows(rows, now) : null) ?? now;
}

/** Days after expiry during which a .eth name can still be renewed and cannot be re-registered. */
export const RENEWAL_GRACE_DAYS = 90;

/**
 * Expiry cohorts are resolved only once their grace period has ended, so the
 * renewal funnel effectively ends 90 days before the data cutoff.
 */
export function toRenewalCohortCutoff(dataCutoff: Date): Date {
  return new Date(dataCutoff.getTime() - RENEWAL_GRACE_DAYS * 86_400_000);
}

export const DATA_DELAYED_AFTER_HOURS = 36;

export function isDataDelayed(asOf: Date, now: Date = new Date()): boolean {
  return now.getTime() - asOf.getTime() > DATA_DELAYED_AFTER_HOURS * 3_600_000;
}

export type RevenueFreshness = {
  /** False until the API sends `meta`; the page then shows no freshness line. */
  reported: boolean;
  /** Oldest `asOf` across the responses, so no card looks fresher than it is. */
  asOf: Date | null;
  delayed: boolean;
};

export function summarizeFreshness(
  metas: RevenueMeta[],
  now: Date = new Date(),
): RevenueFreshness {
  const reported = metas.some((meta) => meta.reported);
  const asOfTimes = metas
    .map((meta) => meta.asOf?.getTime())
    .filter((time): time is number => time !== undefined);
  const asOf = asOfTimes.length > 0 ? new Date(Math.min(...asOfTimes)) : null;
  return {
    reported,
    asOf,
    delayed: asOf !== null && isDataDelayed(asOf, now),
  };
}

/** The slice of a React Query result the revenue cards depend on. */
export type RevenueQueryLike<TData extends { items: unknown[] }> = {
  data?: TData;
  isLoading: boolean;
  isError: boolean;
};

export type RevenueDataState<TItem> = {
  isLoading: boolean;
  /**
   * The card must say "Unavailable" instead of rendering numbers: the request
   * failed or the response has no rows. A degraded response that still has
   * rows is the API's last good copy (at most 30 hours old): it is rendered,
   * and its `asOf` drives the freshness line and the "Data delayed" badge.
   */
  isUnavailable: boolean;
  items: TItem[];
  meta: RevenueMeta;
  cutoff: Date;
  /**
   * True when the cutoff is the API's `asOf`. Otherwise it was inferred, so
   * copy must not present it as a date the data runs to.
   */
  cutoffKnown: boolean;
};

export function toRevenueDataState<TData extends { items: unknown[] }>(
  query: RevenueQueryLike<TData>,
  now: Date = new Date(),
  cutoffFallback: CutoffFallback = "rows",
): RevenueDataState<TData["items"][number]> {
  const meta = readRevenueMeta(query.data);
  const items: TData["items"][number][] = query.data?.items ?? [];
  const isLoading = query.isLoading && !query.data;
  return {
    isLoading,
    isUnavailable:
      !isLoading && (query.data ? items.length === 0 : query.isError),
    items,
    meta,
    cutoff: resolveDataCutoff(
      meta,
      now,
      cutoffFallback === "rows" ? items : undefined,
    ),
    cutoffKnown: meta.asOf !== null,
  };
}

export const UNAVAILABLE_TEXT = "Unavailable";
