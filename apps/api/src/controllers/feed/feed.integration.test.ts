import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Address } from "viem";
import * as schema from "@/database/schema";
import { feedEvent } from "@/database/schema";
import type { Drizzle } from "@/database";
import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import { FeedResponseSchema } from "@/mappers";
import { FeedRepository } from "@/repositories/feed";
import { FeedService } from "@/services/feed";
import { feed } from ".";

type FeedEventInsert = typeof feedEvent.$inferInsert;
type TestFeedEvent = Omit<FeedEventInsert, "value" | "timestamp"> & {
  value: bigint;
  timestamp: number;
};
const nounsThresholds = getDaoRelevanceThreshold(DaoIdEnum.NOUNS);

const testAddress = (suffix: number): Address =>
  `0x000000000000000000000000000000000000${suffix.toString().padStart(4, "0")}`;

const createEvent = (
  overrides: Partial<TestFeedEvent> = {},
): TestFeedEvent => ({
  txHash: "0xabc123def456abc1",
  logIndex: 0,
  type: "VOTE" as const,
  value: nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM],
  timestamp: 1700000000,
  ...overrides,
});

const asArray = (events: TestFeedEvent | TestFeedEvent[]) =>
  Array.isArray(events) ? events : [events];

const insertFeedEvents = async (events: TestFeedEvent | TestFeedEvent[]) => {
  const rows = asArray(events);
  await db.insert(feedEvent).values(rows);

  const proposals = rows
    .filter(
      (event) =>
        event.type === "PROPOSAL" ||
        event.type === "PROPOSAL_EXTENDED" ||
        event.type === "VOTE",
    )
    .map((event) => {
      const id =
        event.type === "VOTE"
          ? `vote-proposal-${event.logIndex}`
          : event.value.toString();
      return {
        id,
        txHash: event.txHash,
        daoId: DaoIdEnum.NOUNS,
        proposerAccountId: testAddress(100 + event.logIndex),
        targets: [] as string[],
        values: [] as bigint[],
        signatures: [] as string[],
        calldatas: [] as string[],
        startBlock: 1,
        endBlock: 2 + event.logIndex,
        title: `Proposal ${id}`,
        description: `Proposal ${id} description`,
        timestamp: BigInt(event.timestamp),
        endTimestamp: BigInt(event.timestamp + 1000),
        status: "PENDING",
      };
    });

  if (proposals.length > 0) {
    await db
      .insert(schema.proposalsOnchain)
      .values(proposals)
      .onConflictDoNothing();
    await db
      .insert(schema.votingPowerHistory)
      .values(
        proposals.map((proposal) => ({
          transactionHash: proposal.txHash,
          accountId: proposal.proposerAccountId,
          daoId: DaoIdEnum.NOUNS,
          votingPower: 123n,
          delta: 123n,
          deltaMod: 123n,
          timestamp: proposal.timestamp,
          logIndex: 0,
        })),
      )
      .onConflictDoNothing();
  }

  const votes = rows
    .filter((event) => event.type === "VOTE")
    .map((event) => ({
      txHash: event.txHash,
      daoId: DaoIdEnum.NOUNS,
      voterAccountId: testAddress(200 + event.logIndex),
      proposalId: `vote-proposal-${event.logIndex}`,
      support: "1",
      votingPower: event.value,
      reason: null,
      timestamp: BigInt(event.timestamp),
    }));
  if (votes.length > 0) {
    await db.insert(schema.votesOnchain).values(votes).onConflictDoNothing();
  }

  const delegations = rows
    .filter((event) => event.type === "DELEGATION")
    .map((event) => ({
      transactionHash: event.txHash,
      daoId: DaoIdEnum.NOUNS,
      delegateAccountId: testAddress(300 + event.logIndex),
      delegatorAccountId: testAddress(400 + event.logIndex),
      delegatedValue: event.value,
      previousDelegate: null,
      timestamp: BigInt(event.timestamp),
      logIndex: event.logIndex,
    }));
  if (delegations.length > 0) {
    await db
      .insert(schema.delegation)
      .values(delegations)
      .onConflictDoNothing();
  }

  const transfers = rows
    .filter((event) => event.type === "TRANSFER")
    .map((event) => ({
      transactionHash: event.txHash,
      daoId: DaoIdEnum.NOUNS,
      tokenId: "token",
      amount: event.value,
      fromAccountId: testAddress(500 + event.logIndex),
      toAccountId: testAddress(600 + event.logIndex),
      timestamp: BigInt(event.timestamp),
      logIndex: event.logIndex,
    }));
  if (transfers.length > 0) {
    await db.insert(schema.transfer).values(transfers).onConflictDoNothing();
  }
};

let client: PGlite;
let db: Drizzle;
let app: Hono;

beforeAll(async () => {
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
  await db.delete(schema.votesOnchain);
  await db.delete(schema.delegation);
  await db.delete(schema.transfer);
  await db.delete(schema.votingPowerHistory);
  await db.delete(schema.accountPower);
  await db.delete(schema.proposalsOnchain);
  const repo = new FeedRepository(db);
  const service = new FeedService(DaoIdEnum.NOUNS, repo);
  app = new Hono();
  feed(app, service);
});

describe("Feed Controller (integration)", () => {
  describe("GET /feed/events", () => {
    const buildExpectedItem = (
      overrides: {
        txHash?: string;
        logIndex?: number;
        type?: string;
        value?: string;
        timestamp?: number;
        relevance?: string;
        metadata?: unknown;
      } = {},
    ): Record<string, unknown> => {
      const item: Record<string, unknown> = {
        txHash: "0xabc123def456abc1",
        logIndex: 0,
        type: "VOTE",
        value: String(
          nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM],
        ),
        timestamp: 1700000000,
        relevance: FeedRelevance.MEDIUM,
        ...overrides,
      };

      if (!("metadata" in overrides)) {
        const logIndex = Number(item.logIndex);
        const type = String(item.type);
        const value = String(item.value);
        const proposalId = type === "VOTE" ? `vote-proposal-${logIndex}` : "0";

        if (type === "VOTE") {
          item.metadata = {
            voter: testAddress(200 + logIndex),
            reason: null,
            support: 1,
            votingPower: value,
            proposalId,
            title: `Proposal ${proposalId}`,
          };
        } else if (type === "DELEGATION") {
          item.metadata = {
            delegator: testAddress(400 + logIndex),
            delegate: testAddress(300 + logIndex),
            previousDelegate: null,
            amount: value,
          };
        } else if (type === "TRANSFER") {
          item.metadata = {
            from: testAddress(500 + logIndex),
            to: testAddress(600 + logIndex),
            amount: value,
          };
        } else if (type === "PROPOSAL") {
          item.metadata = {
            id: proposalId,
            proposer: testAddress(100 + logIndex),
            votingPower: "123",
            title: `Proposal ${proposalId}`,
          };
        } else if (type === "PROPOSAL_EXTENDED") {
          item.metadata = {
            id: proposalId,
            title: `Proposal ${proposalId}`,
            endBlock: 2 + logIndex,
            endTimestamp: String(Number(item.timestamp) + 1000),
            proposer: testAddress(100 + logIndex),
          };
        }
      }

      if (item.type === "PROPOSAL" || item.type === "PROPOSAL_EXTENDED") {
        delete item.value;
      }
      return item;
    };

    it("should return 200 with valid response structure", async () => {
      await insertFeedEvents(createEvent());

      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [buildExpectedItem()],
        totalCount: 1,
      });
    });

    it("should return empty items when no data available", async () => {
      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should include relevance in each item", async () => {
      await insertFeedEvents(createEvent({ type: "PROPOSAL", value: 0n }));

      const res = await app.request("/feed/events");
      const body = await res.json();
      FeedResponseSchema.parse(body);

      expect(body).toEqual({
        items: [
          buildExpectedItem({
            type: "PROPOSAL",
            relevance: FeedRelevance.HIGH,
          }),
        ],
        totalCount: 1,
      });
    });

    it("should return only items matching the type filter when mixed types exist", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      const delegationValue =
        nounsThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM];
      const transferValue =
        nounsThresholds[FeedEventType.TRANSFER][FeedRelevance.MEDIUM];

      await insertFeedEvents([
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
      expect(body).toEqual({
        items: [
          buildExpectedItem({
            type: "DELEGATION",
            logIndex: 1,
            value: String(delegationValue),
            relevance: FeedRelevance.MEDIUM,
          }),
        ],
        totalCount: 1,
      });
    });

    it("should include PROPOSAL_EXTENDED events when no type filter is applied", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];

      await insertFeedEvents([
        createEvent({
          type: "PROPOSAL_EXTENDED",
          value: 0n,
          logIndex: 0,
          timestamp: 1700000000,
        }),
        createEvent({
          type: "VOTE",
          logIndex: 1,
          value: voteValue,
          timestamp: 1700000001,
        }),
      ]);

      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          buildExpectedItem({
            type: "VOTE",
            logIndex: 1,
            value: String(voteValue),
            timestamp: 1700000001,
            relevance: FeedRelevance.MEDIUM,
          }),
          buildExpectedItem({
            type: "PROPOSAL_EXTENDED",
            logIndex: 0,
            timestamp: 1700000000,
            relevance: FeedRelevance.HIGH,
          }),
        ],
        totalCount: 2,
      });
    });

    it("should return only PROPOSAL_EXTENDED items when type=PROPOSAL_EXTENDED filter is applied", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];

      await insertFeedEvents([
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
      expect(body).toEqual({
        items: [
          buildExpectedItem({
            type: "PROPOSAL_EXTENDED",
            logIndex: 0,
            relevance: FeedRelevance.HIGH,
          }),
        ],
        totalCount: 1,
      });
    });

    it("should accept pagination query parameters", async () => {
      await insertFeedEvents([
        createEvent({ logIndex: 0, timestamp: 1700000001 }),
        createEvent({ logIndex: 1, timestamp: 1700000002 }),
        createEvent({ logIndex: 2, timestamp: 1700000003 }),
      ]);

      const res = await app.request("/feed/events?skip=0&limit=2");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          buildExpectedItem({ logIndex: 2, timestamp: 1700000003 }),
          buildExpectedItem({ logIndex: 1, timestamp: 1700000002 }),
        ],
        totalCount: 3,
      });
    });

    it("should accept ordering query parameters", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      // PROPOSAL has value=0, VOTE has value=voteValue (higher)
      await insertFeedEvents([
        createEvent({ type: "PROPOSAL", value: 0n, logIndex: 0 }),
        createEvent({ type: "VOTE", value: voteValue, logIndex: 1 }),
      ]);

      const res = await app.request(
        "/feed/events?orderBy=value&orderDirection=asc",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // asc by value: PROPOSAL (value=0) first, VOTE (value=medium) second
      expect(body).toEqual({
        items: [
          buildExpectedItem({
            type: "PROPOSAL",
            logIndex: 0,
            relevance: FeedRelevance.HIGH,
          }),
          buildExpectedItem({
            type: "VOTE",
            logIndex: 1,
            value: String(voteValue),
            relevance: FeedRelevance.MEDIUM,
          }),
        ],
        totalCount: 2,
      });
    });

    it("should accept relevance query parameter", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      // PROPOSAL has HIGH relevance, VOTE (medium threshold) has MEDIUM relevance
      await insertFeedEvents([
        createEvent({ type: "PROPOSAL", value: 0n, logIndex: 0 }),
        createEvent({ type: "VOTE", value: voteValue, logIndex: 1 }),
      ]);

      const res = await app.request("/feed/events?relevance=HIGH");

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the PROPOSAL event has HIGH relevance
      expect(body).toEqual({
        items: [
          buildExpectedItem({
            type: "PROPOSAL",
            logIndex: 0,
            relevance: FeedRelevance.HIGH,
          }),
        ],
        totalCount: 1,
      });
    });

    it("should return proposal events with zero value as HIGH relevance", async () => {
      const txHash = "0xproposalzerovalue";
      await db.insert(schema.proposalsOnchain).values({
        id: "42",
        txHash,
        daoId: DaoIdEnum.NOUNS,
        proposerAccountId: testAddress(42),
        targets: [] as string[],
        values: [] as bigint[],
        signatures: [] as string[],
        calldatas: [] as string[],
        startBlock: 1,
        endBlock: 2,
        title: "Proposal 42",
        description: "Proposal 42 description",
        timestamp: 1700000000n,
        endTimestamp: 1700000100n,
        status: "PENDING",
      });
      await db.insert(schema.votingPowerHistory).values({
        transactionHash: "0xproposalzerovaluepower",
        accountId: testAddress(42),
        daoId: DaoIdEnum.NOUNS,
        votingPower: 123n,
        delta: 123n,
        deltaMod: 123n,
        timestamp: 1700000000n,
        logIndex: 0,
      });
      await db.insert(feedEvent).values(
        createEvent({
          txHash,
          type: "PROPOSAL",
          value: 0n,
        }),
      );

      const res = await app.request("/feed/events?relevance=HIGH");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          buildExpectedItem({
            txHash,
            type: "PROPOSAL",
            relevance: FeedRelevance.HIGH,
            metadata: {
              id: "42",
              proposer: testAddress(42),
              votingPower: "123",
              title: "Proposal 42",
            },
          }),
        ],
        totalCount: 1,
      });
    });

    it("should accept date range query parameters", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];

      await insertFeedEvents([
        createEvent({ timestamp: 1700000000, logIndex: 0, value: voteValue }),
        createEvent({ timestamp: 1698000000, logIndex: 1, value: voteValue }),
        createEvent({ timestamp: 1702000000, logIndex: 2, value: voteValue }),
      ]);

      const res = await app.request(
        "/feed/events?fromDate=1699000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          buildExpectedItem({
            logIndex: 0,
            value: String(voteValue),
            timestamp: 1700000000,
            relevance: FeedRelevance.MEDIUM,
          }),
        ],
        totalCount: 1,
      });
    });

    it("should build typed metadata from related rows", async () => {
      const voteValue =
        nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      const delegationValue =
        nounsThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM];
      const transferValue =
        nounsThresholds[FeedEventType.TRANSFER][FeedRelevance.MEDIUM];

      await insertFeedEvents([
        createEvent({
          type: "PROPOSAL",
          value: 1n,
          logIndex: 0,
          timestamp: 1700000005,
        }),
        createEvent({
          type: "PROPOSAL_EXTENDED",
          value: 2n,
          logIndex: 1,
          timestamp: 1700000004,
        }),
        createEvent({
          type: "TRANSFER",
          logIndex: 2,
          timestamp: 1700000003,
          value: transferValue,
        }),
        createEvent({
          type: "DELEGATION",
          logIndex: 3,
          timestamp: 1700000002,
          value: delegationValue,
        }),
        createEvent({
          type: "VOTE",
          logIndex: 4,
          timestamp: 1700000001,
          value: voteValue,
        }),
      ]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body).toEqual({
        items: [
          buildExpectedItem({
            type: "PROPOSAL",
            logIndex: 0,
            timestamp: 1700000005,
            relevance: FeedRelevance.HIGH,
            metadata: {
              id: "1",
              proposer: "0x000000000000000000000000000000000000100",
              votingPower: "123",
              title: "Proposal 1",
            },
          }),
          buildExpectedItem({
            type: "PROPOSAL_EXTENDED",
            logIndex: 1,
            timestamp: 1700000004,
            relevance: FeedRelevance.HIGH,
            metadata: {
              id: "2",
              title: "Proposal 2",
              endBlock: 3,
              endTimestamp: "1700001004",
              proposer: "0x000000000000000000000000000000000000101",
            },
          }),
          buildExpectedItem({
            type: "TRANSFER",
            logIndex: 2,
            timestamp: 1700000003,
            value: String(transferValue),
            relevance: FeedRelevance.MEDIUM,
            metadata: {
              from: "0x000000000000000000000000000000000000502",
              to: "0x000000000000000000000000000000000000602",
              amount: transferValue.toString(),
            },
          }),
          buildExpectedItem({
            type: "DELEGATION",
            logIndex: 3,
            timestamp: 1700000002,
            value: String(delegationValue),
            relevance: FeedRelevance.MEDIUM,
            metadata: {
              delegator: "0x000000000000000000000000000000000000403",
              delegate: "0x000000000000000000000000000000000000303",
              previousDelegate: null,
              amount: delegationValue.toString(),
            },
          }),
          buildExpectedItem({
            type: "VOTE",
            logIndex: 4,
            timestamp: 1700000001,
            value: String(voteValue),
            relevance: FeedRelevance.MEDIUM,
            metadata: {
              voter: "0x000000000000000000000000000000000000204",
              reason: null,
              support: 1,
              votingPower: voteValue.toString(),
              proposalId: "vote-proposal-4",
              title: "Proposal vote-proposal-4",
            },
          }),
        ],
        totalCount: 5,
      });
    });
  });
});
