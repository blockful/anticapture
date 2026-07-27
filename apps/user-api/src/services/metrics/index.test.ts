import { describe, expect, it } from "vitest";

import {
  MetricsSnapshotService,
  type MetricsDataSource,
} from "@/services/metrics";

const NOW = new Date("2026-07-27T15:00:00.000Z");
const HOUR = 60 * 60 * 1_000;
const DAY = 24 * HOUR;

const dataSource: MetricsDataSource = {
  counts: async () => ({
    accountsTotal: 9,
    keysLive: 4,
    liveTokens: {
      wallet: 2,
      google: 1,
      email: 1,
    },
  }),
  keysForActiveTokenIds: async () => [
    {
      tokenId: "wallet-token",
      userId: "one",
      createdAt: new Date(NOW.getTime() - 12 * HOUR),
      loginMethod: "wallet",
    },
    {
      tokenId: "google-token",
      userId: "two",
      createdAt: new Date(NOW.getTime() - 3 * DAY),
      loginMethod: "google",
    },
    {
      tokenId: "email-token",
      userId: "three",
      createdAt: new Date(NOW.getTime() - 10 * DAY),
      loginMethod: "email",
    },
    {
      tokenId: "older-wallet-token",
      userId: "four",
      createdAt: new Date(NOW.getTime() - 60 * DAY),
      loginMethod: "wallet",
    },
    {
      tokenId: "oldest-wallet-token",
      userId: "four",
      createdAt: new Date(NOW.getTime() - 90 * DAY),
      loginMethod: "wallet",
    },
  ],
};

describe("validation metrics snapshot", () => {
  it("buckets each active user by their newest owned key age", async () => {
    const service = new MetricsSnapshotService(
      dataSource,
      {
        activeTokenUsage: async () => [
          { tokenId: "wallet-token", count: 12 },
          { tokenId: "google-token", count: 8 },
          { tokenId: "email-token", count: 3 },
          { tokenId: "older-wallet-token", count: 5 },
        ],
      },
      () => NOW,
    );

    await service.refresh();

    expect(service.snapshot()).toEqual({
      accountsTotal: 9,
      keysLive: 4,
      activeUsers: {
        "0-1d": 1,
        "1-7d": 1,
        "7-30d": 1,
        "30d+": 1,
      },
      loginMethods: {
        wallet: { tokens: 2, usage: 17 },
        google: { tokens: 1, usage: 8 },
        email: { tokens: 1, usage: 3 },
      },
    });
  });

  it("skips a refresh while one is already in flight", async () => {
    let inFlight = 0;
    let peak = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const service = new MetricsSnapshotService(
      { ...dataSource, keysForActiveTokenIds: async () => [] },
      {
        activeTokenUsage: async () => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          await gate;
          inFlight -= 1;
          return [];
        },
      },
      () => NOW,
    );

    const first = service.refresh();
    await service.refresh(); // second tick returns immediately, no overlap
    release();
    await first;

    expect(peak).toBe(1);
  });

  it("assigns exact age boundaries to the older bucket", async () => {
    const service = new MetricsSnapshotService(
      {
        ...dataSource,
        keysForActiveTokenIds: async () => [
          {
            tokenId: "one-day",
            userId: "one-day",
            createdAt: new Date(NOW.getTime() - DAY),
            loginMethod: "wallet",
          },
          {
            tokenId: "seven-days",
            userId: "seven-days",
            createdAt: new Date(NOW.getTime() - 7 * DAY),
            loginMethod: "google",
          },
          {
            tokenId: "thirty-days",
            userId: "thirty-days",
            createdAt: new Date(NOW.getTime() - 30 * DAY),
            loginMethod: "email",
          },
        ],
      },
      {
        activeTokenUsage: async () => [
          { tokenId: "one-day", count: 1 },
          { tokenId: "seven-days", count: 1 },
          { tokenId: "thirty-days", count: 1 },
        ],
      },
      () => NOW,
    );

    await service.refresh();

    expect(service.snapshot().activeUsers).toEqual({
      "0-1d": 0,
      "1-7d": 1,
      "7-30d": 1,
      "30d+": 1,
    });
  });

  it.each([
    ["23:30 GMT-3", "2026-07-28T02:30:00.000Z", "2026-07-27T03:00:00.000Z"],
    ["00:30 GMT-3", "2026-07-28T03:30:00.000Z", "2026-07-28T03:00:00.000Z"],
  ])(
    "requests activity since the correct midnight at %s",
    async (_, now, since) => {
      let requestedSince: Date | undefined;
      const service = new MetricsSnapshotService(
        { ...dataSource, keysForActiveTokenIds: async () => [] },
        {
          activeTokenUsage: async (value) => {
            requestedSince = value;
            return [];
          },
        },
        () => new Date(now),
      );

      await service.refresh();

      expect(requestedSince?.toISOString()).toBe(since);
    },
  );
});
