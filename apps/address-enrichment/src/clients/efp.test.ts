import { describe, expect, it, vi, afterEach } from "vitest";

import { EfpClient } from "@/clients/efp";

describe("EfpClient", () => {
  const baseUrl = "https://api.ethfollow.xyz/api/v1";
  const client = new EfpClient(baseUrl);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getUserStats", () => {
    it("parses numeric stats from the API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            followers_count: 5396,
            following_count: 10,
          }),
          { status: 200 },
        ),
      );

      const stats = await client.getUserStats(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      );

      expect(stats).toEqual({
        followersCount: 5396,
        followingCount: 10,
      });
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/users/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/stats`,
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("coerces string counts from the API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            followers_count: "42",
            following_count: "7",
          }),
          { status: 200 },
        ),
      );

      const stats = await client.getUserStats(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      );

      expect(stats).toEqual({
        followersCount: 42,
        followingCount: 7,
      });
    });

    it("returns null on 404", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(null, { status: 404 }),
      );

      const stats = await client.getUserStats(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      );

      expect(stats).toBeNull();
    });
  });

  describe("getFollowerState", () => {
    it("returns follower state with lowercase addresses", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            addressUser: "0xD8DA6BF26964aF9D7eEd9e03E53415D37aA96045",
            addressFollower: "0x983110309620D911731Ac0932219af06091b6744",
            state: { follow: true, block: false, mute: false },
          }),
          { status: 200 },
        ),
      );

      const state = await client.getFollowerState(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "0x983110309620D911731Ac0932219af06091b6744",
      );

      expect(state).toEqual({
        addressUser: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        addressFollower: "0x983110309620d911731ac0932219af06091b6744",
        state: { follow: true, block: false, mute: false },
      });
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/users/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/0x983110309620d911731ac0932219af06091b6744/followerState`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });
});
