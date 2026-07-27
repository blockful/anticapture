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
    keysCreatedTotal: 6,
  }),
  newestKeysForActiveTokenIds: async () => [
    {
      userId: "one",
      createdAt: new Date(NOW.getTime() - 12 * HOUR),
    },
    {
      userId: "two",
      createdAt: new Date(NOW.getTime() - 3 * DAY),
    },
    {
      userId: "three",
      createdAt: new Date(NOW.getTime() - 10 * DAY),
    },
    {
      userId: "four",
      createdAt: new Date(NOW.getTime() - 60 * DAY),
    },
    {
      userId: "four",
      createdAt: new Date(NOW.getTime() - 90 * DAY),
    },
  ],
};

describe("validation metrics snapshot", () => {
  it("buckets each active user by their newest owned key age", async () => {
    const service = new MetricsSnapshotService(
      dataSource,
      {
        activeTokenIds: async () => ["00000000-0000-4000-8000-000000000001"],
      },
      () => NOW,
    );

    await service.refresh();

    expect(service.snapshot()).toEqual({
      accountsTotal: 9,
      keysLive: 4,
      keysCreatedTotal: 6,
      activeUsers: {
        "0-1d": 1,
        "1-7d": 1,
        "7-30d": 1,
        "30d+": 1,
      },
    });
  });

  it("assigns exact age boundaries to the older bucket", async () => {
    const service = new MetricsSnapshotService(
      {
        ...dataSource,
        newestKeysForActiveTokenIds: async () => [
          { userId: "one-day", createdAt: new Date(NOW.getTime() - DAY) },
          {
            userId: "seven-days",
            createdAt: new Date(NOW.getTime() - 7 * DAY),
          },
          {
            userId: "thirty-days",
            createdAt: new Date(NOW.getTime() - 30 * DAY),
          },
        ],
      },
      {
        activeTokenIds: async () => ["00000000-0000-4000-8000-000000000001"],
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
        { ...dataSource, newestKeysForActiveTokenIds: async () => [] },
        {
          activeTokenIds: async (value) => {
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
