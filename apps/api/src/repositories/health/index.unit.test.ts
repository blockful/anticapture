import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { feedEvent } from "@/database/schema";
import { FeedEventType } from "@/lib/constants";

import { HealthRepositoryImpl } from "./index";

type FeedEventInsert = typeof feedEvent.$inferInsert;

const createEvent = (
  overrides: Partial<FeedEventInsert> = {},
): FeedEventInsert => ({
  txHash: "0xabc",
  logIndex: 0,
  type: FeedEventType.TRANSFER,
  value: 0n,
  timestamp: 1700000000,
  ...overrides,
});

describe("HealthRepositoryImpl", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: HealthRepositoryImpl;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new HealthRepositoryImpl(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(feedEvent);
  });

  describe("getLastEventTimestamp", () => {
    it("returns null when no events exist", async () => {
      const result = await repository.getLastEventTimestamp();
      expect(result).toBeNull();
    });

    it("returns the maximum timestamp as a JS number (not a bigint-stringified value)", async () => {
      // Regression guard: pg returns int8 aggregates as strings, which
      // historically leaked all the way to the MCP tool's output schema
      // and broke validation. Repo must coerce to number before returning.
      await db
        .insert(feedEvent)
        .values([
          createEvent({ txHash: "0xa", logIndex: 0, timestamp: 1700000000 }),
          createEvent({ txHash: "0xb", logIndex: 0, timestamp: 1700086400 }),
          createEvent({ txHash: "0xc", logIndex: 0, timestamp: 1699913600 }),
        ]);

      const result = await repository.getLastEventTimestamp();

      expect(typeof result).toBe("number");
      expect(result).toBe(1700086400);
    });
  });

  describe("pingDatabase", () => {
    it("resolves when the database is reachable", async () => {
      await expect(repository.pingDatabase()).resolves.toBeUndefined();
    });
  });
});
