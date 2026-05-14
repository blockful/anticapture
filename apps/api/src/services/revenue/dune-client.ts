import { HTTPException } from "hono/http-exception";

import { logger } from "@/logger";

import { RevenueCache } from "./cache";
import { parseDuneMonth } from "./utils";

export const REVENUE_QUERY_KEYS = [
  "actions",
  "activeNames",
  "newWallets",
  "premiumEth",
  "renewalFunnel",
  "revenueTotals",
  "revenueByAccount",
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

type RawActionRow = {
  date: string;
  category: RevenueActionCategory;
  actions: number;
};

export type RevenueActiveNamesItem = {
  date: number;
  netChange: number;
  cumulativeActive: number;
};

type RawActiveNamesRow = {
  date: string;
  net_change: number;
  cumulative_active: number;
};

export type RevenueNewWalletsItem = {
  date: number;
  newWallets: number;
  cumulativeWallets: number;
};

type RawNewWalletsRow = {
  date: string;
  new_wallets: number;
  cumulative_wallets: number;
};

export type RevenuePremiumEthItem = {
  date: number;
  baseEth: number;
  premiumEth: number;
  totalEth: number;
};

type RawPremiumEthRow = {
  date: string;
  base_eth: number;
  premium_eth: number;
  total_eth: number;
};

export type RevenueRenewalFunnelItem = {
  date: number;
  termsExpiring: number;
  renewedCount: number;
  churnedCount: number;
  renewalRatePct: number;
};

type RawRenewalFunnelRow = {
  expiry_month: string;
  terms_expiring: number;
  renewed_count: number;
  churned_count: number;
  renewal_rate_pct: string;
};

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

type RawRevenueTotalsRow = {
  date: string;
  registration_usd: number;
  premium_usd: number;
  renewal_usd: number;
  total_usd: number;
  registration_eth: number;
  premium_eth: number;
  renewal_eth: number;
};

export class RevenueDuneClient {
  private readonly cache = new RevenueCache();

  constructor(
    private readonly apiKey: string,
    private readonly urls: RevenueDuneUrls,
  ) {}

  public async fetchActions(): Promise<RevenueActionItem[]> {
    const data =
      await this.fetchJson<DuneRowsResponse<RawActionRow>>("actions");
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.date),
      category: row.category,
      actions: row.actions,
    }));
  }

  public async fetchActiveNames(): Promise<RevenueActiveNamesItem[]> {
    const data =
      await this.fetchJson<DuneRowsResponse<RawActiveNamesRow>>("activeNames");
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.date),
      netChange: row.net_change,
      cumulativeActive: row.cumulative_active,
    }));
  }

  public async fetchNewWallets(): Promise<RevenueNewWalletsItem[]> {
    const data =
      await this.fetchJson<DuneRowsResponse<RawNewWalletsRow>>("newWallets");
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.date),
      newWallets: row.new_wallets,
      cumulativeWallets: row.cumulative_wallets,
    }));
  }

  public async fetchPremiumEth(): Promise<RevenuePremiumEthItem[]> {
    const data =
      await this.fetchJson<DuneRowsResponse<RawPremiumEthRow>>("premiumEth");
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.date),
      baseEth: row.base_eth,
      premiumEth: row.premium_eth,
      totalEth: row.total_eth,
    }));
  }

  public async fetchRenewalFunnel(): Promise<RevenueRenewalFunnelItem[]> {
    const data =
      await this.fetchJson<DuneRowsResponse<RawRenewalFunnelRow>>(
        "renewalFunnel",
      );
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.expiry_month),
      termsExpiring: row.terms_expiring,
      renewedCount: row.renewed_count,
      churnedCount: row.churned_count,
      renewalRatePct: parseFloat(row.renewal_rate_pct),
    }));
  }

  public async fetchRevenueTotals(): Promise<RevenueTotalsItem[]> {
    const data =
      await this.fetchJson<DuneRowsResponse<RawRevenueTotalsRow>>(
        "revenueTotals",
      );
    return data.result.rows.map((row) => ({
      date: parseDuneMonth(row.date),
      registrationUsd: row.registration_usd,
      premiumUsd: row.premium_usd,
      renewalUsd: row.renewal_usd,
      totalUsd: row.total_usd,
      registrationEth: row.registration_eth,
      premiumEth: row.premium_eth,
      renewalEth: row.renewal_eth,
    }));
  }

  protected async fetchJson<T>(key: RevenueQueryKey): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const url = this.urls[key];
    try {
      const response = await fetch(url, {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as T;
      this.cache.set(key, data);
      return data;
    } catch (error) {
      logger.error(
        { err: error, key },
        "failed to fetch revenue data from Dune",
      );
      throw new HTTPException(503, {
        message: "Failed to fetch revenue data",
        cause: error,
      });
    }
  }
}
