import { z } from "zod";

import { recordDegradedUpstream } from "@/lib/degraded-upstream";
import {
  isDegradableUpstreamStatus,
  PROVIDER_TIMEOUT_MS,
  UpstreamUnavailableError,
  upstreamRejectedRequest,
} from "@/lib/upstream-error";
import { logger } from "@/logger";

import { RevenueCache, REVENUE_STALE_TTL_MS } from "./cache";
import { parseDuneMonth } from "./utils";

/**
 * Envelope every Dune result endpoint shares, wrapped around the row schema of
 * the query being fetched. Validating the columns here, before anything is
 * cached, is what keeps a renamed or nulled column from being stored for 24h
 * and then failing in the mappers on every later request.
 */
const duneEnvelopeSchema = <Row>(rowSchema: z.ZodType<Row>) =>
  z.object({
    result: z.object({
      rows: z.array(rowSchema),
    }),
  });

/**
 * Dune returns null for an aggregate with no underlying rows, so the count and
 * amount columns are nullable and the mappers default them to zero.
 */
const nullableNumber = z.number().nullable();

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

export type DuneRowsResponse<T> = {
  result: {
    rows: T[];
  };
};

export type RevenueActionCategory = "Registration" | "Renewal" | "Premium";

export type RevenueActionItem = {
  date: number;
  category: RevenueActionCategory;
  actions: number;
};

const RawActionRowSchema = z.object({
  month: z.string(),
  category: z.enum(["Registration", "Renewal", "Premium"]),
  actions: nullableNumber,
});

export type RevenueActiveNamesItem = {
  date: number;
  netChange: number;
  cumulativeActive: number;
};

const RawActiveNamesRowSchema = z.object({
  month: z.string(),
  net_change: nullableNumber,
  cumulative_active: nullableNumber,
});

export type RevenueNewWalletsItem = {
  date: number;
  newWallets: number;
  cumulativeWallets: number;
};

const RawNewWalletsRowSchema = z.object({
  month: z.string(),
  new_wallets: nullableNumber,
  cumulative_wallets: nullableNumber,
});

export type RevenueRenewalFunnelItem = {
  date: number;
  termsExpiring: number;
  renewedCount: number;
  churnedCount: number;
  renewalRatePct: number;
};

const RawRenewalFunnelRowSchema = z.object({
  expiry_month: z.string(),
  terms_expiring: nullableNumber,
  renewed_count: nullableNumber,
  churned_count: nullableNumber,
  // Dune serialises this ratio as text.
  renewal_rate_pct: z.string().nullable(),
});

export type RevenueByCategoryCategory = "Registration" | "Renewal";

export type RevenueByCategoryItem = {
  date: number;
  category: RevenueByCategoryCategory;
  revenueUsd: number;
  revenueEth: number;
};

const RawRevenueByCategoryRowSchema = z.object({
  month: z.string(),
  category: z.enum(["Registration", "Renewal"]),
  revenue_usd: nullableNumber,
  revenue_eth: nullableNumber,
});

export type RevenueRenewalTenureBucket =
  | "0 renewals (one-shot)"
  | "1 renewal"
  | "2 renewals"
  | "3+ renewals";

export type RevenueRenewalTenureItem = {
  date: number;
  tenureBucket: RevenueRenewalTenureBucket;
  names: number;
  totalRenewalsInBucket: number;
};

const RawRenewalTenureRowSchema = z.object({
  expiry_month: z.string(),
  tenure_bucket: z.enum([
    "0 renewals (one-shot)",
    "1 renewal",
    "2 renewals",
    "3+ renewals",
  ]),
  names: nullableNumber,
  total_renewals_in_bucket: nullableNumber,
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
  month: z.string(),
  registration_usd: nullableNumber,
  premium_usd: nullableNumber,
  renewal_usd: nullableNumber,
  total_usd: nullableNumber,
  registration_eth: nullableNumber,
  premium_eth: nullableNumber,
  renewal_eth: nullableNumber,
});

export class RevenueDuneClient {
  private readonly cache = new RevenueCache();
  private readonly inFlight = new Map<
    RevenueQueryKey,
    Promise<DuneRowsResponse<unknown>>
  >();

  constructor(
    private readonly apiKey: string,
    private readonly urls: RevenueDuneUrls,
  ) {}

  public async fetchActions(): Promise<RevenueActionItem[]> {
    const data = await this.fetchJson("actions", RawActionRowSchema);
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.month),
      category: row.category,
      actions: row.actions ?? 0,
    }));
  }

  public async fetchActiveNames(): Promise<RevenueActiveNamesItem[]> {
    const data = await this.fetchJson("activeNames", RawActiveNamesRowSchema);
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.month),
      netChange: row.net_change ?? 0,
      cumulativeActive: row.cumulative_active ?? 0,
    }));
  }

  public async fetchNewWallets(): Promise<RevenueNewWalletsItem[]> {
    const data = await this.fetchJson("newWallets", RawNewWalletsRowSchema);
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.month),
      newWallets: row.new_wallets ?? 0,
      cumulativeWallets: row.cumulative_wallets ?? 0,
    }));
  }

  public async fetchRenewalFunnel(): Promise<RevenueRenewalFunnelItem[]> {
    const data = await this.fetchJson(
      "renewalFunnel",
      RawRenewalFunnelRowSchema,
    );
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.expiry_month),
      termsExpiring: row.terms_expiring ?? 0,
      renewedCount: row.renewed_count ?? 0,
      churnedCount: row.churned_count ?? 0,
      renewalRatePct: parseFloat(row.renewal_rate_pct ?? "0"),
    }));
  }

  public async fetchRenewalTenure(): Promise<RevenueRenewalTenureItem[]> {
    const data = await this.fetchJson(
      "renewalTenure",
      RawRenewalTenureRowSchema,
    );
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.expiry_month),
      tenureBucket: row.tenure_bucket,
      names: row.names ?? 0,
      totalRenewalsInBucket: row.total_renewals_in_bucket ?? 0,
    }));
  }

  public async fetchRevenueByCategory(): Promise<RevenueByCategoryItem[]> {
    const data = await this.fetchJson(
      "revenueByCategory",
      RawRevenueByCategoryRowSchema,
    );
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.month),
      category: row.category,
      revenueUsd: row.revenue_usd ?? 0,
      revenueEth: row.revenue_eth ?? 0,
    }));
  }

  public async fetchRevenueTotals(): Promise<RevenueTotalsItem[]> {
    const data = await this.fetchJson(
      "revenueTotals",
      RawRevenueTotalsRowSchema,
    );
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.month),
      registrationUsd: row.registration_usd ?? 0,
      premiumUsd: row.premium_usd ?? 0,
      renewalUsd: row.renewal_usd ?? 0,
      totalUsd: row.total_usd ?? 0,
      registrationEth: row.registration_eth ?? 0,
      premiumEth: row.premium_eth ?? 0,
      renewalEth: row.renewal_eth ?? 0,
    }));
  }

  /**
   * Fetches a Dune result set, caching it for 24h. When Dune is unhealthy the
   * last known result is served stale, or an empty result set when there is
   * none. Revenue is third-party data: an outage there must never surface as a
   * 5xx, because the gateway counts 5xx against the whole DAO's circuit
   * breaker. A Dune rejection, such as a deleted query id, is our
   * misconfiguration and is not degraded away.
   */
  protected async fetchJson<Row>(
    key: RevenueQueryKey,
    rowSchema: z.ZodType<Row>,
  ): Promise<DuneRowsResponse<Row>> {
    const cached = this.cache.get<DuneRowsResponse<Row>>(key);
    if (cached !== null) {
      logger.debug({ key }, "revenue cache hit");
      return cached;
    }

    // One upstream call per key at a time. Without this every request during an
    // outage opens its own call and waits the full provider timeout.
    const existing = this.inFlight.get(key);
    if (existing) {
      logger.debug({ key }, "joining in-flight revenue fetch");
      return (await existing) as DuneRowsResponse<Row>;
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
  ): Promise<DuneRowsResponse<Row>> {
    const url = this.urls[key];
    const start = Date.now();
    logger.info({ key, url }, "fetching revenue data from Dune");

    let data: DuneRowsResponse<Row>;
    let status: number;
    try {
      ({ data, status } = await this.requestRows(url, rowSchema));
    } catch (error) {
      // Only a Dune outage degrades. Anything else is our own failure or a
      // rejected request, and must surface so the HTTP error metrics count it.
      if (!(error instanceof UpstreamUnavailableError)) throw error;
      logger.error(
        { err: error, key, durationMs: Date.now() - start },
        "failed to fetch revenue data from Dune",
      );
      const stale = this.cache.getStale<DuneRowsResponse<Row>>(key);
      recordDegradedUpstream({
        upstream: error.upstream,
        resource: `revenue_${key}`,
        mode: stale !== null ? "stale" : "empty",
        error,
      });
      if (stale === null) return { result: { rows: [] } };
      // Lease the stale value briefly so the outage is not re-probed by every
      // single request, while still refreshing soon after Dune recovers.
      this.cache.set(key, stale, REVENUE_STALE_TTL_MS);
      return stale;
    }

    this.cache.set(key, data);
    logger.info(
      {
        key,
        status,
        rowCount: data.result.rows.length,
        durationMs: Date.now() - start,
      },
      "revenue fetch succeeded",
    );
    return data;
  }

  /**
   * Calls one Dune result endpoint and validates the rows against the schema
   * of that query, before the caller can cache them. Transport failures,
   * timeouts, retryable statuses, invalid JSON and a shape mismatch mean Dune
   * is unhealthy. A rejection such as a bad API key or an unknown query id is
   * our problem and surfaces as a 502 instead of degrading silently.
   */
  private async requestRows<Row>(
    url: string,
    rowSchema: z.ZodType<Row>,
  ): Promise<{ data: DuneRowsResponse<Row>; status: number }> {
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

    return { data: envelope.data, status: response.status };
  }
}
