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
