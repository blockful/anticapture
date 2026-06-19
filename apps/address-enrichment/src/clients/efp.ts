import { z } from "zod";

import { logger } from "@/logger";

const EfpUserStatsResponseSchema = z.object({
  followers_count: z.coerce.number(),
  following_count: z.coerce.number(),
});

const EfpFollowerStateResponseSchema = z.object({
  addressUser: z.string(),
  addressFollower: z.string(),
  state: z.object({
    follow: z.boolean(),
    block: z.boolean(),
    mute: z.boolean(),
  }),
});

export interface EfpUserStats {
  followersCount: number;
  followingCount: number;
}

export interface EfpFollowerState {
  addressUser: string;
  addressFollower: string;
  state: { follow: boolean; block: boolean; mute: boolean };
}

type EfpFetchResult<T> =
  | ({ outcome: "success" } & T)
  | { outcome: "not_found" }
  | { outcome: "error" };

export type EfpUserStatsFetchResult = EfpFetchResult<{ stats: EfpUserStats }>;
export type EfpFollowerStateFetchResult = EfpFetchResult<{
  state: EfpFollowerState;
}>;

export class EfpClient {
  constructor(private readonly baseUrl: string) {}

  async getUserStats(address: string): Promise<EfpUserStatsFetchResult> {
    const user = address.toLowerCase();
    const result = await this.get(
      `/users/${user}/stats`,
      EfpUserStatsResponseSchema,
      { address: user },
      "EFP stats",
    );
    if (result.outcome !== "success") return result;
    return {
      outcome: "success",
      stats: {
        followersCount: result.data.followers_count,
        followingCount: result.data.following_count,
      },
    };
  }

  /** Returns whether `addressFollower` follows `addressUser` on EFP. */
  async getFollowerState(
    addressUser: string,
    addressFollower: string,
  ): Promise<EfpFollowerStateFetchResult> {
    const user = addressUser.toLowerCase();
    const follower = addressFollower.toLowerCase();
    const result = await this.get(
      `/users/${user}/${follower}/followerState`,
      EfpFollowerStateResponseSchema,
      { addressUser: user, addressFollower: follower },
      "EFP follower state",
    );
    if (result.outcome !== "success") return result;
    return {
      outcome: "success",
      state: {
        addressUser: result.data.addressUser.toLowerCase(),
        addressFollower: result.data.addressFollower.toLowerCase(),
        state: result.data.state,
      },
    };
  }

  /** Distinguishes a definitive 404 (`not_found`) from any other failure (`error`). */
  private async get<T>(
    path: string,
    schema: z.ZodType<T>,
    context: Record<string, string>,
    label: string,
  ): Promise<EfpFetchResult<{ data: T }>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 404) return { outcome: "not_found" };
        logger.error(
          {
            ...context,
            status: response.status,
            statusText: response.statusText,
          },
          `${label} API error`,
        );
        return { outcome: "error" };
      }

      const parsed = schema.safeParse(await response.json());
      if (!parsed.success) {
        logger.error(
          { ...context, err: parsed.error },
          `failed to parse ${label}`,
        );
        return { outcome: "error" };
      }

      return { outcome: "success", data: parsed.data };
    } catch (err) {
      logger.error({ ...context, err }, `failed to fetch ${label}`);
      return { outcome: "error" };
    }
  }
}
