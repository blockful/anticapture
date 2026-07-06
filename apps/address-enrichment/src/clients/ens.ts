import { z } from "zod";

import { logger } from "@/logger";

/**
 * ENS + EFP data response schema from ethfollow API
 * Based on https://api.ethfollow.xyz/api/v1/users/:addressOrENS/details
 */
const DetailsResponseSchema = z.object({
  ens: z
    .object({
      name: z.string().nullable().optional(),
      avatar: z.string().nullable().optional(),
      records: z
        .object({
          header: z.string().nullable().optional(),
          "com.twitter": z.string().nullable().optional(),
          "org.telegram": z.string().nullable().optional(),
          email: z.string().nullable().optional(),
          "com.github": z.string().nullable().optional(),
        })
        .passthrough()
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  followers_count: z.number().nullable().optional(),
  following_count: z.number().nullable().optional(),
});

/**
 * ENS text records hold either a bare handle (`foo`, `@foo`) or, occasionally, a
 * full URL (`https://twitter.com/foo`). The API contract promises a bare handle
 * without '@', so reduce both forms here before storing/exposing.
 */
const normalizeHandle = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const handle = trimmed.includes("/")
    ? ((trimmed.split(/[?#]/)[0] ?? "").split("/").filter(Boolean).pop() ?? "")
    : trimmed;
  const bare = handle.replace(/^@/, "");
  return bare || null;
};

const normalizeEmail = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const email = value.trim().replace(/^mailto:/i, "");
  return email || null;
};

export interface EnsData {
  name: string | null;
  avatar: string | null;
  banner: string | null;
  twitter: string | null;
  telegram: string | null;
  email: string | null;
  github: string | null;
  followers: number | null;
  following: number | null;
}

export class ENSClient {
  private readonly baseUrl = "https://api.ethfollow.xyz";

  /**
   * Fetches ENS + EFP data for an address via ethfollow API.
   * EFP follower/following counts are returned independently of whether the
   * address has a primary ENS name, so we no longer short-circuit on a missing
   * name — only a failed fetch/parse yields null.
   * @param address - Ethereum address (0x...)
   * @returns ENS + EFP data or null if not found / API error
   */
  async getEnsData(address: string): Promise<EnsData | null> {
    try {
      logger.info({ address }, "Fetching ENS data");
      const response = await fetch(
        `${this.baseUrl}/api/v1/users/${address}/details`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          logger.info({ address }, "The address has no ENS");
          return null;
        }
        logger.error(
          { address, status: response.status, statusText: response.statusText },
          "ENS API error",
        );
        return null;
      }

      const data = await response.json();
      const parsed = DetailsResponseSchema.safeParse(data);

      if (!parsed.success) {
        logger.error(
          { err: parsed.error, address },
          "failed to parse ENS response",
        );
        return null;
      }

      const { ens, followers_count, following_count } = parsed.data;
      const records = ens?.records ?? null;
      logger.info(
        {
          address,
          data: {
            name: ens?.name ?? null,
            avatar: ens?.avatar ? "<Omitted>" : null,
            banner: records?.header ? "<Omitted>" : null,
          },
        },
        "Response data from ENS API",
      );

      return {
        name: ens?.name ?? null,
        avatar: ens?.avatar ?? null,
        banner: records?.header ?? null,
        twitter: normalizeHandle(records?.["com.twitter"]),
        telegram: normalizeHandle(records?.["org.telegram"]),
        email: normalizeEmail(records?.email),
        github: normalizeHandle(records?.["com.github"]),
        followers: followers_count ?? null,
        following: following_count ?? null,
      };
    } catch (error) {
      logger.error({ err: error, address }, "failed to fetch ENS data");
      return null;
    }
  }
}
