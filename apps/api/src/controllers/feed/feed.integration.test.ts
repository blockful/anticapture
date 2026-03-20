import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as schema from "@/database/schema";
import { feedEvent } from "@/database/schema";
import type { Drizzle } from "@/database";
import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import { FeedRepository } from "@/repositories/feed";
import { FeedService } from "@/services/feed";
import { feed } from ".";

type FeedEventInsert = typeof feedEvent.$inferInsert;
const nounsThresholds = getDaoRelevanceThreshold(DaoIdEnum.NOUNS);

const createEvent = (
  overrides: Partial<FeedEventInsert> = {},
): FeedEventInsert => ({
  txHash: "0xabc123def456abc1",
  logIndex: 0,
  type: "VOTE" as const,
  value: nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM],
  timestamp: 1700000000,
  metadata: null,
  ...overrides,
});

let client: PGlite;
let db: Drizzle;
let app: Hono;

beforeAll(async () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  client = new PGlite();
  db = drizzle(client, { schema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(schema, db as any);
  await apply();
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(feedEvent);
  const repo = new FeedRepository(db);
  const service = new FeedService(DaoIdEnum.NOUNS, repo);
  app = new Hono();
  feed(app, service);
});

describe("Feed Controller (integration)", () => {
  describe("GET /feed/events", () => {
    it("should return 200 with valid response structure", async () => {
      await db.insert(feedEvent).values(createEvent());

      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            txHash: "0xabc123def456abc1",
            logIndex: 0,
            type: "VOTE",
            value: String(
              nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM],
            ),
            timestamp: 1700000000,
            relevance: FeedRelevance.MEDIUM,
            metadata: null,
          },
        ],
        totalCount: 1,
      });
    });

    it("should return empty items when no data available", async () => {
      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(0);
      expect(body.totalCount).toBe(0);
    });

    it("should include relevance in each item", async () => {
      await db
        .insert(feedEvent)
        .values(createEvent({ type: "PROPOSAL", value: 0n }));

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.relevance).toBe(FeedRelevance.HIGH);
    });

    it("should return only items matching the type filter when mixed types exist", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      const delegationValue =
        nounsThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM];
      const transferValue =
        nounsThresholds[FeedEventType.TRANSFER][FeedRelevance.MEDIUM];

      await db.insert(feedEvent).values([
        createEvent({ type: "VOTE", logIndex: 0, value: voteValue }),
        createEvent({
          type: "DELEGATION",
          logIndex: 1,
          value: delegationValue,
        }),
        createEvent({ type: "TRANSFER", logIndex: 2, value: transferValue }),
      ]);

      const res = await app.request("/feed/events?type=DELEGATION");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]?.type).toBe("DELEGATION");
    });

    it("should include PROPOSAL_EXTENDED events when no type filter is applied", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];

      await db.insert(feedEvent).values([
        createEvent({
          type: "PROPOSAL_EXTENDED",
          value: 0n,
          logIndex: 0,
        }),
        createEvent({ type: "VOTE", logIndex: 1, value: voteValue }),
      ]);

      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      const types = body.items.map((i: { type: string }) => i.type);
      expect(types).toContain("PROPOSAL_EXTENDED");
    });

    it("should return only PROPOSAL_EXTENDED items when type=PROPOSAL_EXTENDED filter is applied", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];

      await db.insert(feedEvent).values([
        createEvent({
          type: "PROPOSAL_EXTENDED",
          value: 0n,
          logIndex: 0,
        }),
        createEvent({ type: "VOTE", logIndex: 1, value: voteValue }),
        createEvent({ type: "PROPOSAL", value: 0n, logIndex: 2 }),
      ]);

      const res = await app.request("/feed/events?type=PROPOSAL_EXTENDED");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]?.type).toBe("PROPOSAL_EXTENDED");
    });

    it("should accept pagination query parameters", async () => {
      await db
        .insert(feedEvent)
        .values([
          createEvent({ logIndex: 0 }),
          createEvent({ logIndex: 1 }),
          createEvent({ logIndex: 2 }),
        ]);

      const res = await app.request("/feed/events?skip=0&limit=2");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(3);
      expect(body.items).toHaveLength(2);
    });

    it("should accept ordering query parameters", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      // PROPOSAL has value=0, VOTE has value=voteValue (higher)
      await db
        .insert(feedEvent)
        .values([
          createEvent({ type: "PROPOSAL", value: 0n, logIndex: 0 }),
          createEvent({ type: "VOTE", value: voteValue, logIndex: 1 }),
        ]);

      const res = await app.request(
        "/feed/events?orderBy=value&orderDirection=asc",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      // asc by value: PROPOSAL (value=0) first, VOTE (value=medium) second
      expect(body.items[0].type).toBe("PROPOSAL");
      expect(body.items[1].type).toBe("VOTE");
    });

    it("should accept relevance query parameter", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      // PROPOSAL has HIGH relevance, VOTE (medium threshold) has MEDIUM relevance
      await db
        .insert(feedEvent)
        .values([
          createEvent({ type: "PROPOSAL", value: 0n, logIndex: 0 }),
          createEvent({ type: "VOTE", value: voteValue, logIndex: 1 }),
        ]);

      const res = await app.request("/feed/events?relevance=HIGH");

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the PROPOSAL event has HIGH relevance
      expect(body.items).toHaveLength(1);
      expect(body.items[0].type).toBe("PROPOSAL");
    });

    it("should accept date range query parameters", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];

      await db
        .insert(feedEvent)
        .values([
          createEvent({ timestamp: 1700000000, logIndex: 0, value: voteValue }),
          createEvent({ timestamp: 1698000000, logIndex: 1, value: voteValue }),
          createEvent({ timestamp: 1702000000, logIndex: 2, value: voteValue }),
        ]);

      const res = await app.request(
        "/feed/events?fromDate=1699000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]?.timestamp).toBe(1700000000);
    });

    it("should include metadata in response", async () => {
      const metadata = { proposalId: "1", title: "Test" };
      await db
        .insert(feedEvent)
        .values(createEvent({ type: "PROPOSAL", value: 0n, metadata }));

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should handle null metadata", async () => {
      await db.insert(feedEvent).values(createEvent({ metadata: null }));

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toBeNull();
    });

    it("should handle empty metadata object", async () => {
      await db
        .insert(feedEvent)
        .values(createEvent({ metadata: {} as Record<string, unknown> }));

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual({});
    });

    it("should preserve VOTE metadata shape", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      const metadata = {
        reason: "I support this proposal",
        support: 1,
        votingPower: "50000000000000000000000",
        proposalId: "42",
      };
      await db
        .insert(feedEvent)
        .values(createEvent({ type: "VOTE", value: voteValue, metadata }));

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should preserve DELEGATION metadata shape", async () => {
      const delegationValue =
        nounsThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM];
      const metadata = {
        delegator: "0x1234567890abcdef1234567890abcdef12345678",
        delegate: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        previousDelegate: "0x0000000000000000000000000000000000000000",
      };
      await db
        .insert(feedEvent)
        .values(
          createEvent({ type: "DELEGATION", value: delegationValue, metadata }),
        );

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should preserve TRANSFER metadata shape", async () => {
      const transferValue =
        nounsThresholds[FeedEventType.TRANSFER][FeedRelevance.MEDIUM];
      const metadata = {
        from: "0x1234567890abcdef1234567890abcdef12345678",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      };
      await db
        .insert(feedEvent)
        .values(
          createEvent({ type: "TRANSFER", value: transferValue, metadata }),
        );

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should preserve metadata with numeric values", async () => {
      const delegationValue =
        nounsThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM];
      const metadata = {
        delta: 1000,
        deltaMod: 1000,
        delegate: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      };
      await db
        .insert(feedEvent)
        .values(
          createEvent({ type: "DELEGATION", value: delegationValue, metadata }),
        );

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should preserve different metadata per item in a mixed list", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      const transferValue =
        nounsThresholds[FeedEventType.TRANSFER][FeedRelevance.MEDIUM];

      const proposalMeta = { id: "1", proposer: "0xabc", title: "Test" };
      const transferMeta = { from: "0x111", to: "0x222" };

      // Insert with different timestamps so desc ordering returns proposal first
      await db.insert(feedEvent).values([
        createEvent({
          type: "PROPOSAL",
          value: 0n,
          logIndex: 0,
          timestamp: 1700000003,
          metadata: proposalMeta,
        }),
        createEvent({
          type: "TRANSFER",
          logIndex: 1,
          timestamp: 1700000002,
          value: transferValue,
          metadata: transferMeta,
        }),
        createEvent({
          type: "VOTE",
          logIndex: 2,
          timestamp: 1700000001,
          value: voteValue,
          metadata: null,
        }),
      ]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items).toHaveLength(3);
      expect(body.items[0]?.metadata).toEqual(proposalMeta);
      expect(body.items[1]?.metadata).toEqual(transferMeta);
      expect(body.items[2]?.metadata).toBeNull();
    });
  });
});
