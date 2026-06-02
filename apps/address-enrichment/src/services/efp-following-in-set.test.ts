import { describe, expect, it, vi, afterEach } from "vitest";

import type { EfpClient } from "@/clients/efp";
import { getFollowingInSet } from "@/services/efp-following-in-set";

describe("getFollowingInSet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns addresses the viewer follows, excluding block/mute", async () => {
    const getFollowerState = vi.fn(async (user: string, follower: string) => {
      if (user === "0xaaa" && follower === "0xviewer") {
        return {
          addressUser: user,
          addressFollower: follower,
          state: { follow: true, block: false, mute: false },
        };
      }
      if (user === "0xbbb" && follower === "0xviewer") {
        return {
          addressUser: user,
          addressFollower: follower,
          state: { follow: true, block: true, mute: false },
        };
      }
      if (user === "0xccc" && follower === "0xviewer") {
        return {
          addressUser: user,
          addressFollower: follower,
          state: { follow: true, block: false, mute: true },
        };
      }
      return {
        addressUser: user,
        addressFollower: follower,
        state: { follow: false, block: false, mute: false },
      };
    });

    const efpClient = { getFollowerState } as unknown as EfpClient;

    const followed = await getFollowingInSet(
      efpClient,
      "0xViewer",
      ["0xAAA", "0xBBB", "0xCCC", "0xDDD"],
      2,
    );

    expect(followed).toEqual(["0xaaa"]);
    expect(getFollowerState).toHaveBeenCalledTimes(4);
    expect(getFollowerState).toHaveBeenCalledWith("0xaaa", "0xviewer");
  });

  it("processes addresses in bounded concurrency batches", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const getFollowerState = vi.fn(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight -= 1;
      return null;
    });

    const efpClient = { getFollowerState } as unknown as EfpClient;
    const addresses = Array.from(
      { length: 25 },
      (_, i) => `0x${i.toString(16).padStart(40, "0")}`,
    );

    await getFollowingInSet(efpClient, "0xviewer", addresses, 10);

    expect(maxInFlight).toBeLessThanOrEqual(10);
    expect(getFollowerState).toHaveBeenCalledTimes(25);
  });
});
