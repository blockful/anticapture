import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

import * as schema from "@/database/schema";
import { feedEvent } from "@/database/schema";
import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { FeedRequest } from "@/mappers";

import { FeedRepository } from ".";

type FeedEventInsert = typeof feedEvent.$inferInsert;

const defaultFeedParams = (
  overrides: Partial<FeedRequest> = {},
): FeedRequest => ({
  skip: 0,
  limit: 10,
  orderBy: "timestamp",
  orderDirection: "desc",
  relevance: FeedRelevance.MEDIUM,
  ...overrides,
});

const defaultThresholds = (
  overrides: Partial<Record<FeedEventType, bigint>> = {},
): Record<FeedEventType, bigint> => ({
  [FeedEventType.VOTE]: 0n,
  [FeedEventType.DELEGATION]: 0n,
  [FeedEventType.TRANSFER]: 0n,
  // [FeedEventType.DELEGATION_VOTES_CHANGED]: 0n,
  [FeedEventType.PROPOSAL]: 0n,
  [FeedEventType.PROPOSAL_EXTENDED]: 0n,
  ...overrides,
});

const createFeedEvent = (
  overrides: Partial<FeedEventInsert> = {},
): FeedEventInsert => ({
  txHash: "0xabc123",
  logIndex: 0,
  type: "VOTE",
  value: 1000n,
  timestamp: 1700000000,
  metadata: null,
  ...overrides,
});

describe("FeedRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: FeedRepository;

  beforeAll(async () => {
    (BigInt.prototype as unknown as { toJSON: () => string }).toJSON =
      function () {
        return this.toString();
      };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new FeedRepository(db);

    const { apply } = await pushSchema(
      schema,
      db as unknown as Parameters<typeof pushSchema>[1],
    );
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(feedEvent);
  });

  describe("getFeedEvents", () => {
    it("should return items and totalCount", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0 }),
          createFeedEvent({ logIndex: 1 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams(),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty when no data exists", async () => {
      const result = await repository.getFeedEvents(
        defaultFeedParams(),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter by fromDate (gte)", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, timestamp: 1000 }),
          createFeedEvent({ logIndex: 1, timestamp: 2000 }),
          createFeedEvent({ logIndex: 2, timestamp: 3000 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ orderDirection: "asc", fromDate: 2000 }),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.timestamp).toBe(2000);
      expect(result.items[1]?.timestamp).toBe(3000);
    });

    it("should filter by toDate (lte)", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, timestamp: 1000 }),
          createFeedEvent({ logIndex: 1, timestamp: 2000 }),
          createFeedEvent({ logIndex: 2, timestamp: 3000 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ orderDirection: "asc", toDate: 2000 }),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.timestamp).toBe(1000);
      expect(result.items[1]?.timestamp).toBe(2000);
    });

    it("should filter by both fromDate and toDate", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, timestamp: 1000 }),
          createFeedEvent({ logIndex: 1, timestamp: 2000 }),
          createFeedEvent({ logIndex: 2, timestamp: 3000 }),
          createFeedEvent({ logIndex: 3, timestamp: 4000 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({
          orderDirection: "asc",
          fromDate: 2000,
          toDate: 3000,
        }),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.timestamp).toBe(2000);
      expect(result.items[1]?.timestamp).toBe(3000);
    });

    it("should filter by specific type with value threshold", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, type: "VOTE", value: 500n }),
          createFeedEvent({ logIndex: 1, type: "VOTE", value: 1500n }),
          createFeedEvent({ logIndex: 2, type: "DELEGATION", value: 2000n }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ type: FeedEventType.VOTE }),
        defaultThresholds({ [FeedEventType.VOTE]: 1000n }),
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.value).toBe(1500n);
    });

    it("should include PROPOSAL type without value threshold", async () => {
      await db.insert(feedEvent).values([
        createFeedEvent({
          logIndex: 0,
          type: "PROPOSAL",
          value: 0n,
        }),
        createFeedEvent({
          logIndex: 1,
          type: "PROPOSAL",
          value: 1n,
        }),
      ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ type: FeedEventType.PROPOSAL }),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
    });

    it("should apply per-type value thresholds when no type filter", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, type: "VOTE", value: 500n }),
          createFeedEvent({ logIndex: 1, type: "VOTE", value: 2000n }),
          createFeedEvent({ logIndex: 2, type: "DELEGATION", value: 100n }),
          createFeedEvent({ logIndex: 3, type: "DELEGATION", value: 600n }),
          createFeedEvent({ logIndex: 4, type: "PROPOSAL", value: 0n }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams(),
        defaultThresholds({
          [FeedEventType.VOTE]: 1000n,
          [FeedEventType.DELEGATION]: 500n,
        }),
      );

      expect(result.items).toHaveLength(3);
      const types = result.items.map((i) => `${i.type}:${i.value}`).sort();
      expect(types).toEqual(["DELEGATION:600", "PROPOSAL:0", "VOTE:2000"]);
    });

    it("should order by timestamp descending", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, timestamp: 1000 }),
          createFeedEvent({ logIndex: 1, timestamp: 3000 }),
          createFeedEvent({ logIndex: 2, timestamp: 2000 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams(),
        defaultThresholds(),
      );

      expect(result.items.map((i) => i.timestamp)).toEqual([3000, 2000, 1000]);
    });

    it("should order by timestamp ascending", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, timestamp: 3000 }),
          createFeedEvent({ logIndex: 1, timestamp: 1000 }),
          createFeedEvent({ logIndex: 2, timestamp: 2000 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ orderDirection: "asc" }),
        defaultThresholds(),
      );

      expect(result.items.map((i) => i.timestamp)).toEqual([1000, 2000, 3000]);
    });

    it("should order by value descending", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, value: 100n }),
          createFeedEvent({ logIndex: 1, value: 300n }),
          createFeedEvent({ logIndex: 2, value: 200n }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ orderBy: "value" }),
        defaultThresholds(),
      );

      expect(result.items.map((i) => i.value)).toEqual([300n, 200n, 100n]);
    });

    it("should apply pagination with skip", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, timestamp: 3000 }),
          createFeedEvent({ logIndex: 1, timestamp: 2000 }),
          createFeedEvent({ logIndex: 2, timestamp: 1000 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ skip: 1 }),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.timestamp).toBe(2000);
    });

    it("should apply pagination with limit", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, timestamp: 3000 }),
          createFeedEvent({ logIndex: 1, timestamp: 2000 }),
          createFeedEvent({ logIndex: 2, timestamp: 1000 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ limit: 2 }),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(3);
    });

    it("should return totalCount independent of pagination", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0 }),
          createFeedEvent({ logIndex: 1 }),
          createFeedEvent({ logIndex: 2 }),
          createFeedEvent({ logIndex: 3 }),
          createFeedEvent({ logIndex: 4 }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ skip: 2, limit: 2 }),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(5);
    });

    it("should preserve metadata in returned items", async () => {
      const metadata = { proposalId: "42", title: "Test Proposal" };
      await db
        .insert(feedEvent)
        .values([createFeedEvent({ logIndex: 0, type: "PROPOSAL", metadata })]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ type: FeedEventType.PROPOSAL }),
        defaultThresholds(),
      );

      expect(result.items[0]?.metadata).toEqual(metadata);
    });
  });
});
