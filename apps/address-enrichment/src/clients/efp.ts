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

export type EfpUserStatsFetchResult =
  | { outcome: "success"; stats: EfpUserStats }
  | { outcome: "not_found" }
  | { outcome: "error" };

export interface EfpFollowerState {
  addressUser: string;
  addressFollower: string;
  state: {
    follow: boolean;
    block: boolean;
    mute: boolean;
  };
}

export type EfpFollowerStateFetchResult =
  | { outcome: "success"; state: EfpFollowerState }
  | { outcome: "not_found" }
  | { outcome: "error" };

export class EfpClient {
  constructor(private readonly baseUrl: string) {}

  /**
   * Fetches EFP follower/following counts for an address.
   */
  async getUserStats(address: string): Promise<EfpUserStatsFetchResult> {
    const normalizedAddress = address.toLowerCase();

    try {
      const response = await fetch(
        `${this.baseUrl}/users/${normalizedAddress}/stats`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { outcome: "not_found" };
        }
        logger.error(
          {
            address: normalizedAddress,
            status: response.status,
            statusText: response.statusText,
          },
          "EFP stats API error",
        );
        return { outcome: "error" };
      }

      const data = await response.json();
      const parsed = EfpUserStatsResponseSchema.safeParse(data);

      if (!parsed.success) {
        logger.error(
          { err: parsed.error, address: normalizedAddress },
          "failed to parse EFP stats response",
        );
        return { outcome: "error" };
      }

      return {
        outcome: "success",
        stats: {
          followersCount: parsed.data.followers_count,
          followingCount: parsed.data.following_count,
        },
      };
    } catch (error) {
      logger.error(
        { err: error, address: normalizedAddress },
        "failed to fetch EFP stats",
      );
      return { outcome: "error" };
    }
  }

  /**
   * Returns whether addressFollower follows addressUser on EFP.
   * Path: /users/{addressUser}/{addressFollower}/followerState
   */
  async getFollowerState(
    addressUser: string,
    addressFollower: string,
  ): Promise<EfpFollowerStateFetchResult> {
    const user = addressUser.toLowerCase();
    const follower = addressFollower.toLowerCase();

    try {
      const response = await fetch(
        `${this.baseUrl}/users/${user}/${follower}/followerState`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { outcome: "not_found" };
        }
        logger.error(
          {
            addressUser: user,
            addressFollower: follower,
            status: response.status,
            statusText: response.statusText,
          },
          "EFP follower state API error",
        );
        return { outcome: "error" };
      }

      const data = await response.json();
      const parsed = EfpFollowerStateResponseSchema.safeParse(data);

      if (!parsed.success) {
        logger.error(
          { err: parsed.error, addressUser: user, addressFollower: follower },
          "failed to parse EFP follower state response",
        );
        return { outcome: "error" };
      }

      return {
        outcome: "success",
        state: {
          addressUser: parsed.data.addressUser.toLowerCase(),
          addressFollower: parsed.data.addressFollower.toLowerCase(),
          state: parsed.data.state,
        },
      };
    } catch (error) {
      logger.error(
        { err: error, addressUser: user, addressFollower: follower },
        "failed to fetch EFP follower state",
      );
      return { outcome: "error" };
    }
  }
}
