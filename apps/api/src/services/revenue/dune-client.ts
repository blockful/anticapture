import { HTTPException } from "hono/http-exception";

import { logger } from "@/logger";

import { RevenueCache } from "./cache";

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

export class RevenueDuneClient {
  private readonly cache = new RevenueCache();

  constructor(
    private readonly apiKey: string,
    private readonly urls: RevenueDuneUrls,
  ) {}

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
