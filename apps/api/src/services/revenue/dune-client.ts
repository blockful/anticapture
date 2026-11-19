import { z } from "zod";

import { recordDegradedUpstream } from "@/lib/degraded-upstream";
import {
  isDegradableUpstreamStatus,
  PROVIDER_TIMEOUT_MS,
  UpstreamUnavailableError,
  upstreamRejectedRequest,
  describeUpstreamError,
  redactUrl,
} from "@/lib/upstream-error";
import { logger } from "@/logger";
import { recordRevenueDataAsOf } from "@/metrics";

import { RevenueCache, REVENUE_STALE_TTL_MS } from "./cache";
import { DUNE_MONTH_REGEX, isValidDuneMonth, parseDuneMonth } from "./utils";

/**
 * When the execution behind a result finished, which is how old its rows are.
 * Dune sends nanoseconds; this keeps milliseconds in ISO-8601 UTC. A missing
 * or unreadable value leaves the age unknown instead of rejecting good rows.
 */
const duneExecutionEndedAt = z.iso
  .datetime({ offset: true })
  .nullish()
  .catch((ctx) => {
    logger.warn(
      { value: ctx.value },
      "ignoring unreadable Dune execution_ended_at",
    );
    return null;
  })
  .transform((value) => (value == null ? null : new Date(value).toISOString()));

/**
 * Envelope every Dune result endpoint shares, wrapped around the row schema of
 * the query being fetched. Validating the columns here, before anything is
 * cached, is what keeps a renamed or nulled column from being stored for the cache TTL
 * and then failing in the mappers on every later request.
 */
const duneEnvelopeSchema = <Row>(rowSchema: z.ZodType<Row>) =>
  z.object({
    execution_ended_at: duneExecutionEndedAt,
    result: z.object({
      rows: z.array(rowSchema),
    }),
  });

const revenueMetaSchema = z.object({
  asOf: z.string().nullable(),
  degraded: z.boolean(),
});

/** What the in-flight map and the cache hold: validated rows plus their meta. */
const revenueRowsSchema = <Row>(rowSchema: z.ZodType<Row>) =>
  z.object({
    rows: z.array(rowSchema),
    meta: revenueMetaSchema,
  });

/**
 * Month columns are parsed by `parseDuneMonth`, so validate the exact format it
 * accepts. A format change would otherwise pass validation, be cached for the TTL,
 * and throw in the mapper on every later request.
 */
const duneMonth = z
  .string()
  .regex(DUNE_MONTH_REGEX)
  .refine(isValidDuneMonth, { message: "not a calendar date" });

/**
 * Dune serialises decimals and bigints as text and returns null for an
 * aggregate with no underlying rows, so numeric columns accept either form and
 * the mappers default null to zero.
 */
const duneNumeric = z
  .union([z.string(), z.number()])
  .nullable()
  .transform((value, ctx) => {
    if (value === null) return null;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({ code: "custom", message: `Not a number: ${value}` });
      return z.NEVER;
    }
    return parsed;
  });

/**
 * Label columns are validated as plain strings so that one category a query
 * author added does not reject the whole series. The unknown rows are dropped
 * in the mapper instead, because the response schemas for these routes are
 * strict enums and widening them is an API contract change.
 */
const ACTION_CATEGORIES = ["Registration", "Renewal", "Premium"] as const;
const REVENUE_CATEGORIES = ["Registration", "Renewal"] as const;
const TENURE_BUCKETS = [
  "0 renewals (one-shot)",
  "1 renewal",
  "2 renewals",
  "3+ renewals",
] as const;

/** Narrows a Dune label to the union the response schema allows, or drops it. */
const knownLabel = <Known extends string>(
  value: string,
  known: readonly Known[],
  column: string,
): Known | undefined => {
  if ((known as readonly string[]).includes(value)) return value as Known;
  logger.warn({ column, value }, "dropping revenue row with unknown label");
  return undefined;
};

export const REVENUE_QUERY_KEYS = [
  "actions",
  "activeNames",
  "newWallets",
  "renewalFunnel",
  "revenueTotals",
  "revenueByCategory",
  "renewalTenure",
] as const;

export type RevenueQueryKey = (typeof REVENUE_QUERY_KEYS)[number];

export type RevenueDuneUrls = Record<RevenueQueryKey, string>;

/**
 * How fresh a revenue answer is. `asOf` is Dune's `execution_ended_at` for the
 * rows served, null when unknown or when nothing could be served. `degraded`
 * is true when the rows are a stale copy or the empty fallback served after a
 * Dune failure, or when no Dune client is configured.
 */
export type RevenueMeta = {
  asOf: string | null;
  degraded: boolean;
};

/** Validated rows of one Dune query and how fresh they are. */
export type RevenueRows<T> = {
  rows: T[];
  meta: RevenueMeta;
};

/** Mapped items of one revenue series and how fresh they are. */
export type RevenueSeries<T> = {
  items: T[];
  meta: RevenueMeta;
};

/** Nothing to serve and no time to report: an empty, degraded answer. */
const emptyRows = <T>(): RevenueRows<T> => ({
  rows: [],
  meta: { asOf: null, degraded: true },
});

export type RevenueActionCategory = (typeof ACTION_CATEGORIES)[number];

export type RevenueActionItem = {
  date: number;
  category: RevenueActionCategory;
  actions: number;
};

const RawActionRowSchema = z.object({
  month: duneMonth,
  category: z.string(),
  actions: duneNumeric,
});

export type RevenueActiveNamesItem = {
  date: number;
  netChange: number;
  cumulativeActive: number;
};

const RawActiveNamesRowSchema = z.object({
  month: duneMonth,
  net_change: duneNumeric,
  cumulative_active: duneNumeric,
});

export type RevenueNewWalletsItem = {
  date: number;
  newWallets: number;
  cumulativeWallets: number;
};

const RawNewWalletsRowSchema = z.object({
  month: duneMonth,
  new_wallets: duneNumeric,
  cumulative_wallets: duneNumeric,
});

export type RevenueRenewalFunnelItem = {
  date: number;
  termsExpiring: number;
  renewedCount: number;
  churnedCount: number;
  renewalRatePct: number;
};

const RawRenewalFunnelRowSchema = z.object({
  expiry_month: duneMonth,
  terms_expiring: duneNumeric,
  renewed_count: duneNumeric,
  churned_count: duneNumeric,
  renewal_rate_pct: duneNumeric,
});

export type RevenueByCategoryCategory = (typeof REVENUE_CATEGORIES)[number];

export type RevenueByCategoryItem = {
  date: number;
  category: RevenueByCategoryCategory;
  revenueUsd: number;
  revenueEth: number;
};

const RawRevenueByCategoryRowSchema = z.object({
  month: duneMonth,
  category: z.string(),
  revenue_usd: duneNumeric,
  revenue_eth: duneNumeric,
});

export type RevenueRenewalTenureBucket = (typeof TENURE_BUCKETS)[number];

export type RevenueRenewalTenureItem = {
  date: number;
  tenureBucket: RevenueRenewalTenureBucket;
  names: number;
  totalRenewalsInBucket: number;
};

const RawRenewalTenureRowSchema = z.object({
  expiry_month: duneMonth,
  tenure_bucket: z.string(),
  names: duneNumeric,
  total_renewals_in_bucket: duneNumeric,
});

export type RevenueTotalsItem = {
  date: number;
  registrationUsd: number;
  premiumUsd: number;
  renewalUsd: number;
  totalUsd: number;
  registrationEth: number;
  premiumEth: number;
  renewalEth: number;
};

const RawRevenueTotalsRowSchema = z.object({
  month: duneMonth,
  registration_usd: duneNumeric,
  premium_usd: duneNumeric,
  renewal_usd: duneNumeric,
  total_usd: duneNumeric,
  registration_eth: duneNumeric,
  premium_eth: duneNumeric,
  renewal_eth: duneNumeric,
});

export class RevenueDuneClient {
  private readonly cache = new RevenueCache();
  /** Keys whose last fetch failed with nothing stale to serve, and until when. */
  private readonly emptyUntil = new Map<string, number>();
  private readonly inFlight = new Map<
    RevenueQueryKey,
    Promise<RevenueRows<unknown>>
  >();

  constructor(
    private readonly apiKey: string,
    private readonly urls: RevenueDuneUrls,
  ) {}

  public async fetchActions(): Promise<RevenueSeries<RevenueActionItem>> {
    const { rows, meta } = await this.fetchJson("actions", RawActionRowSchema);
    const items = rows.flatMap((row) => {
      const category = knownLabel(row.category, ACTION_CATEGORIES, "category");
      if (!category) return [];
      return [
        {
          date: parseDuneMonth(row.month),
          category,
          actions: row.actions ?? 0,
        },
      ];
    });
    return { items, meta };
  }

  public async fetchActiveNames(): Promise<
    RevenueSeries<RevenueActiveNamesItem>
  > {
    const { rows, meta } = await this.fetchJson(
      "activeNames",
      RawActiveNamesRowSchema,
    );
    const items = rows.map((row) => ({
      date: parseDuneMonth(row.month),
      netChange: row.net_change ?? 0,
      cumulativeActive: row.cumulative_active ?? 0,
    }));
    return { items, meta };
  }

  public async fetchNewWallets(): Promise<
    RevenueSeries<RevenueNewWalletsItem>
  > {
    const { rows, meta } = await this.fetchJson(
      "newWallets",
      RawNewWalletsRowSchema,
    );
    const items = rows.map((row) => ({
      date: parseDuneMonth(row.month),
      newWallets: row.new_wallets ?? 0,
      cumulativeWallets: row.cumulative_wallets ?? 0,
    }));
    return { items, meta };
  }

  public async fetchRenewalFunnel(): Promise<
    RevenueSeries<RevenueRenewalFunnelItem>
  > {
    const { rows, meta } = await this.fetchJson(
      "renewalFunnel",
      RawRenewalFunnelRowSchema,
    );
    const items = rows.map((row) => ({
      date: parseDuneMonth(row.expiry_month),
      termsExpiring: row.terms_expiring ?? 0,
      renewedCount: row.renewed_count ?? 0,
      churnedCount: row.churned_count ?? 0,
      renewalRatePct: row.renewal_rate_pct ?? 0,
    }));
    return { items, meta };
  }

  public async fetchRenewalTenure(): Promise<
    RevenueSeries<RevenueRenewalTenureItem>
  > {
    const { rows, meta } = await this.fetchJson(
      "renewalTenure",
      RawRenewalTenureRowSchema,
    );
    const items = rows.flatMap((row) => {
      const tenureBucket = knownLabel(
        row.tenure_bucket,
        TENURE_BUCKETS,
        "tenure_bucket",
      );
      if (!tenureBucket) return [];
      return [
        {
          date: parseDuneMonth(row.expiry_month),
          tenureBucket,
          names: row.names ?? 0,
          totalRenewalsInBucket: row.total_renewals_in_bucket ?? 0,
        },
      ];
    });
    return { items, meta };
  }

  public async fetchRevenueByCategory(): Promise<
    RevenueSeries<RevenueByCategoryItem>
  > {
    const { rows, meta } = await this.fetchJson(
      "revenueByCategory",
      RawRevenueByCategoryRowSchema,
    );
    const items = rows.flatMap((row) => {
      const category = knownLabel(row.category, REVENUE_CATEGORIES, "category");
      if (!category) return [];
      return [
        {
          date: parseDuneMonth(row.month),
          category,
          revenueUsd: row.revenue_usd ?? 0,
          revenueEth: row.revenue_eth ?? 0,
        },
      ];
    });
    return { items, meta };
  }

  public async fetchRevenueTotals(): Promise<RevenueSeries<RevenueTotalsItem>> {
    const { rows, meta } = await this.fetchJson(
      "revenueTotals",
      RawRevenueTotalsRowSchema,
    );
    const items = rows.map((row) => ({
      date: parseDuneMonth(row.month),
      registrationUsd: row.registration_usd ?? 0,
      premiumUsd: row.premium_usd ?? 0,
      renewalUsd: row.renewal_usd ?? 0,
      totalUsd: row.total_usd ?? 0,
      registrationEth: row.registration_eth ?? 0,
      premiumEth: row.premium_eth ?? 0,
      renewalEth: row.renewal_eth ?? 0,
    }));
    return { items, meta };
  }

  /**
   * Fetches a Dune result set, caching it for REVENUE_CACHE_TTL_MS (6h). When Dune is unhealthy the
   * last known result is served stale, or an empty result set when there is
   * none, and the answer's meta says so. Revenue is third-party data: an
   * outage there must never surface as a 5xx, because the gateway counts 5xx
   * against the whole DAO's circuit breaker. A Dune rejection, such as a bad
   * API key, is our misconfiguration and is not degraded away.
   */
  protected async fetchJson<Row>(
    key: RevenueQueryKey,
    rowSchema: z.ZodType<Row>,
  ): Promise<RevenueRows<Row>> {
    const cached = this.cache.get<RevenueRows<Row>>(key);
    if (cached !== null) {
      logger.debug({ key }, "revenue cache hit");
      return cached;
    }

    // One upstream call per key at a time. Without this every request during an
    // outage opens its own call and waits the full provider timeout.
    const existing = this.inFlight.get(key);
    if (existing) {
      logger.debug({ key }, "joining in-flight revenue fetch");
      // Re-validated rather than cast: the promise is shared between callers,
      // so the map cannot carry each caller's row type. Every caller for a key
      // passes the same schema, so this parse is a formality that stays honest.
      const shared = revenueRowsSchema(rowSchema).safeParse(await existing);
      if (!shared.success) {
        throw new UpstreamUnavailableError(
          "dune",
          "Dune returned an unexpected result shape",
          { cause: shared.error },
        );
      }
      return shared.data;
    }

    const pending = this.fetchAndCache(key, rowSchema);
    this.inFlight.set(key, pending);
    try {
      return await pending;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private async fetchAndCache<Row>(
    key: RevenueQueryKey,
    rowSchema: z.ZodType<Row>,
  ): Promise<RevenueRows<Row>> {
    const url = this.urls[key];
    // An outage with nothing stale to serve must not be re-probed by every
    // request: seven revenue queries at the 15 s provider deadline would hang
    // one page for close to two minutes. The empty answer is leased for the
    // same short window a stale one is. Leased answers are not counted again
    // on degraded_upstream_responses_total: inside the window the counter
    // counts probes, not responses, which is enough for the alert to fire.
    const emptyUntil = this.emptyUntil.get(key);
    if (emptyUntil !== undefined && Date.now() < emptyUntil) {
      return emptyRows();
    }
    const start = Date.now();
    logger.info(
      { key, url: redactUrl(url) },
      "fetching revenue data from Dune",
    );

    let data: RevenueRows<Row>;
    let status: number;
    try {
      ({ data, status } = await this.requestRows(url, rowSchema));
    } catch (error) {
      // Only a Dune outage degrades. Anything else is our own failure or a
      // rejected request, and must surface so the HTTP error metrics count it.
      if (!(error instanceof UpstreamUnavailableError)) throw error;
      logger.error(
        {
          err: describeUpstreamError(error),
          key,
          durationMs: Date.now() - start,
        },
        "failed to fetch revenue data from Dune",
      );
      const stale = this.cache.getStale<RevenueRows<Row>>(key);
      recordDegradedUpstream({
        upstream: error.upstream,
        resource: `revenue_${key}`,
        mode: stale !== null ? "stale" : "empty",
        reason: error.reason,
        error,
      });
      if (stale === null) {
        // Lease only what a retry would pay for again: a transport failure
        // or a provider status. A body that could not be read came back at
        // once, and the next response may already be a good one.
        const unreadableBody =
          error.cause instanceof z.ZodError ||
          error.cause instanceof SyntaxError;
        if (!unreadableBody) {
          this.emptyUntil.set(key, Date.now() + REVENUE_STALE_TTL_MS);
        }
        return emptyRows();
      }
      // Lease the stale value briefly so the outage is not re-probed by every
      // single request, while still refreshing soon after Dune recovers. The
      // copy keeps the asOf of the execution that produced it, and the lease
      // is marked degraded so the requests it answers are not cached as fresh.
      const degraded: RevenueRows<Row> = {
        rows: stale.rows,
        meta: { asOf: stale.meta.asOf, degraded: true },
      };
      this.cache.set(key, degraded, REVENUE_STALE_TTL_MS);
      return degraded;
    }

    this.cache.set(key, data);
    recordRevenueDataAsOf(key, data.meta.asOf);
    logger.info(
      {
        key,
        status,
        rowCount: data.rows.length,
        asOf: data.meta.asOf,
        durationMs: Date.now() - start,
      },
      "revenue fetch succeeded",
    );
    return data;
  }

  /**
   * Calls one Dune result endpoint and validates the rows against the schema
   * of that query, before the caller can cache them. Transport failures,
   * timeouts, retryable statuses, a 404, a 402, invalid JSON and a shape
   * mismatch degrade. A rejection such as a bad API key is our problem and
   * surfaces as a 502 instead of degrading silently.
   */
  private async requestRows<Row>(
    url: string,
    rowSchema: z.ZodType<Row>,
  ): Promise<{ data: RevenueRows<Row>; status: number }> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
    } catch (error) {
      throw new UpstreamUnavailableError("dune", "Dune request failed", {
        cause: error,
      });
    }

    if (!response.ok) {
      // A 404 on a results endpoint means the query has no completed
      // execution for its latest version (it was edited and never re-run, or
      // never run at all), or its last result expired. The query id is fine;
      // it needs a re-run on Dune, which no waiting here will do. Turning it
      // into a 502 would leave the route 5xx-ing, which is exactly what the
      // stale and empty fallbacks exist to avoid, so it degrades, under its
      // own reason so operators can tell it from a passing outage.
      if (response.status === 404) {
        throw new UpstreamUnavailableError(
          "dune",
          `HTTP 404: ${response.statusText}`,
          { reason: "not_found" },
        );
      }
      // A 402 is Dune refusing to serve results under the account's billing
      // limits (no credits, or the datapoint cap for the cycle). Like the 404
      // it will not clear by waiting, and like it a 502 would trip the gateway
      // breaker for the whole DAO, so it degrades under its own reason. This
      // stays local to revenue: the shared status check still rejects a 402
      // for every other provider. A 401 or 403 stays loud: a bad key is fixed
      // by us, not by waiting.
      if (response.status === 402) {
        throw new UpstreamUnavailableError(
          "dune",
          `HTTP 402: ${response.statusText}`,
          { reason: "payment_required" },
        );
      }
      if (!isDegradableUpstreamStatus(response.status)) {
        throw upstreamRejectedRequest("dune", response.status, url);
      }
      throw new UpstreamUnavailableError(
        "dune",
        `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new UpstreamUnavailableError(
        "dune",
        "Dune returned a malformed body",
        { cause: error },
      );
    }

    const envelope = duneEnvelopeSchema(rowSchema).safeParse(body);
    if (!envelope.success) {
      throw new UpstreamUnavailableError(
        "dune",
        "Dune returned an unexpected result shape",
        { cause: envelope.error },
      );
    }

    return {
      data: {
        rows: envelope.data.result.rows,
        meta: { asOf: envelope.data.execution_ended_at, degraded: false },
      },
      status: response.status,
    };
  }
}
