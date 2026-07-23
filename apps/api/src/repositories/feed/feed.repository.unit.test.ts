import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { zeroAddress } from "viem";

import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import {
  delegation,
  feedEvent,
  proposalsOnchain,
  transfer,
  votesOnchain,
  votingPowerHistory,
} from "@/database/schema";
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
  proposalId: null,
  ...overrides,
});

describe("FeedRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: FeedRepository;

  beforeAll(async () => {
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
    await db.delete(votesOnchain);
    await db.delete(proposalsOnchain);
    await db.delete(delegation);
    await db.delete(transfer);
    await db.delete(votingPowerHistory);
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
        defaultFeedParams({ type: [FeedEventType.VOTE] }),
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
        defaultFeedParams({ type: [FeedEventType.PROPOSAL] }),
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

    it("should synthesize metadata for PROPOSAL events from related tables", async () => {
      const proposerAccountId = zeroAddress;
      const proposalTimestamp = 1700000000n;
      // Seed two votingPowerHistory rows: one before the proposal (should be
      // picked), one after (must be ignored).
      await db.insert(votingPowerHistory).values([
        {
          transactionHash: "0xprior",
          daoId: "ENS",
          accountId: proposerAccountId,
          votingPower: 12345n,
          delta: 12345n,
          deltaMod: 12345n,
          timestamp: proposalTimestamp - 100n,
          logIndex: 0,
        },
        {
          transactionHash: "0xlater",
          daoId: "ENS",
          accountId: proposerAccountId,
          votingPower: 999999n,
          delta: 987654n,
          deltaMod: 987654n,
          timestamp: proposalTimestamp + 100n,
          logIndex: 0,
        },
      ]);
      await db.insert(proposalsOnchain).values({
        id: "42",
        txHash: "0xabc123",
        daoId: "ENS",
        proposerAccountId,
        targets: [],
        values: [],
        signatures: [],
        calldatas: [],
        startBlock: 0,
        endBlock: 100,
        title: "Test Proposal",
        description: "desc",
        timestamp: proposalTimestamp,
        endTimestamp: 1700001000n,
        status: "ACTIVE",
      });
      await db.insert(feedEvent).values([
        createFeedEvent({
          logIndex: 0,
          type: "PROPOSAL",
          proposalId: "42",
        }),
      ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ type: [FeedEventType.PROPOSAL] }),
        defaultThresholds(),
      );

      expect(result.items[0]?.metadata).toEqual({
        kind: FeedEventType.PROPOSAL,
        id: "42",
        proposer: proposerAccountId,
        votingPower: "12345",
        title: "Test Proposal",
      });
    });

    it("should fall back to '0' for PROPOSAL voting power when no history exists", async () => {
      const proposerAccountId = zeroAddress;
      await db.insert(proposalsOnchain).values({
        id: "43",
        txHash: "0xabc123",
        daoId: "ENS",
        proposerAccountId,
        targets: [],
        values: [],
        signatures: [],
        calldatas: [],
        startBlock: 0,
        endBlock: 100,
        title: "No History",
        description: "desc",
        timestamp: 1700000000n,
        endTimestamp: 1700001000n,
        status: "ACTIVE",
      });
      await db.insert(feedEvent).values([
        createFeedEvent({
          logIndex: 0,
          type: "PROPOSAL",
          proposalId: "43",
        }),
      ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ type: [FeedEventType.PROPOSAL] }),
        defaultThresholds(),
      );

      expect(result.items[0]?.metadata).toMatchObject({
        votingPower: "0",
      });
    });

    it("should synthesize metadata for DELEGATION events from delegations table", async () => {
      const delegator = "0x1111111111111111111111111111111111111111";
      const delegate = "0x2222222222222222222222222222222222222222";
      await db.insert(delegation).values({
        transactionHash: "0xabc123",
        daoId: "ENS",
        delegatorAccountId: delegator,
        delegateAccountId: delegate,
        delegatedValue: 9999n,
        previousDelegate: zeroAddress,
        timestamp: 1700000000n,
        logIndex: 7,
      });
      await db.insert(feedEvent).values([
        createFeedEvent({
          logIndex: 7,
          type: "DELEGATION",
          value: 9999n,
        }),
      ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ type: [FeedEventType.DELEGATION] }),
        defaultThresholds(),
      );

      expect(result.items[0]?.metadata).toEqual({
        kind: FeedEventType.DELEGATION,
        delegator,
        delegate,
        previousDelegate: zeroAddress,
        amount: "9999",
      });
    });

    it("should synthesize metadata for TRANSFER events from transfers table", async () => {
      const fromAddr = "0x3333333333333333333333333333333333333333";
      const toAddr = "0x4444444444444444444444444444444444444444";
      await db.insert(transfer).values({
        transactionHash: "0xabc123",
        daoId: "ENS",
        tokenId: zeroAddress,
        amount: 4242n,
        fromAccountId: fromAddr,
        toAccountId: toAddr,
        timestamp: 1700000000n,
        logIndex: 3,
      });
      await db.insert(feedEvent).values([
        createFeedEvent({
          logIndex: 3,
          type: "TRANSFER",
          value: 4242n,
        }),
      ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ type: [FeedEventType.TRANSFER] }),
        defaultThresholds(),
      );

      expect(result.items[0]?.metadata).toEqual({
        kind: FeedEventType.TRANSFER,
        from: fromAddr,
        to: toAddr,
        amount: "4242",
      });
    });

    it("should synthesize metadata for VOTE events with proposal title", async () => {
      const voter = "0x5555555555555555555555555555555555555555";
      await db.insert(proposalsOnchain).values({
        id: "99",
        txHash: "0xdef",
        daoId: "ENS",
        proposerAccountId: zeroAddress,
        targets: [],
        values: [],
        signatures: [],
        calldatas: [],
        startBlock: 0,
        endBlock: 100,
        title: "Voted Proposal",
        description: "desc",
        timestamp: 1700000000n,
        endTimestamp: 1700001000n,
        status: "ACTIVE",
      });
      await db.insert(votesOnchain).values({
        txHash: "0xabc123",
        daoId: "ENS",
        voterAccountId: voter,
        proposalId: "99",
        support: "1",
        votingPower: 7777n,
        reason: "Because",
        timestamp: 1700000000n,
        logIndex: 4,
      });
      await db.insert(feedEvent).values([
        createFeedEvent({
          logIndex: 4,
          type: "VOTE",
          value: 7777n,
          proposalId: "99",
        }),
      ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({ type: [FeedEventType.VOTE] }),
        defaultThresholds(),
      );

      expect(result.items[0]?.metadata).toEqual({
        kind: FeedEventType.VOTE,
        voter,
        reason: "Because",
        support: 1,
        votingPower: "7777",
        proposalId: "99",
        title: "Voted Proposal",
      });
    });

    it("should support filtering by multiple types in one request", async () => {
      await db
        .insert(feedEvent)
        .values([
          createFeedEvent({ logIndex: 0, type: "VOTE", value: 1500n }),
          createFeedEvent({ logIndex: 1, type: "DELEGATION", value: 600n }),
          createFeedEvent({ logIndex: 2, type: "TRANSFER", value: 5000n }),
        ]);

      const result = await repository.getFeedEvents(
        defaultFeedParams({
          type: [FeedEventType.VOTE, FeedEventType.DELEGATION],
        }),
        defaultThresholds(),
      );

      expect(result.items).toHaveLength(2);
      const types = result.items.map((i) => i.type).sort();
      expect(types).toEqual(["DELEGATION", "VOTE"]);
    });

    describe("address filter", () => {
      const DELEGATOR = "0xAaAaAAAaaAaAAaAaAaAAAAAaAAAAaaAAAAaAaAA1";
      const DELEGATE = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBb2";
      const PREVIOUS_DELEGATE = "0xCcccCcCCcCCCCCcCcCcccCcCCCcCccccccCCCCc3";
      const SENDER = "0xdDDDddDdDdddDDdDDDDdDDDDDDDddDDdDdDdDDd4";
      const RECIPIENT = "0xEEEeEEEeeEeEeeEEEEeeeeEEeEeeeEEeEEeeEeE5";
      const VOTER = "0xFFffFfFffFFFfffffFfFFFfFfffFfFFFFffFFF6";
      const PROPOSER = "0x1234123412341234123412341234123412341234";

      beforeEach(async () => {
        await db.insert(feedEvent).values([
          createFeedEvent({ txHash: "0xd1", logIndex: 0, type: "DELEGATION" }),
          createFeedEvent({ txHash: "0xt1", logIndex: 0, type: "TRANSFER" }),
          createFeedEvent({ txHash: "0xv1", logIndex: 0, type: "VOTE" }),
          createFeedEvent({ txHash: "0xp1", logIndex: 0, type: "PROPOSAL" }),
          createFeedEvent({
            txHash: "0xe1",
            logIndex: 0,
            type: "PROPOSAL_EXTENDED",
            proposalId: "prop-1",
          }),
        ]);
        await db.insert(delegation).values({
          transactionHash: "0xd1",
          daoId: "UNI",
          delegateAccountId: DELEGATE,
          delegatorAccountId: DELEGATOR,
          previousDelegate: PREVIOUS_DELEGATE,
          delegatedValue: 100n,
          timestamp: 1700000000n,
          logIndex: 0,
        });
        await db.insert(transfer).values({
          transactionHash: "0xt1",
          daoId: "UNI",
          tokenId: "token",
          amount: 100n,
          fromAccountId: SENDER,
          toAccountId: RECIPIENT,
          timestamp: 1700000000n,
          logIndex: 0,
        });
        await db.insert(votesOnchain).values({
          txHash: "0xv1",
          daoId: "UNI",
          voterAccountId: VOTER,
          proposalId: "prop-1",
          support: "1",
          votingPower: 100n,
          timestamp: 1700000000n,
          logIndex: 0,
        });
        await db.insert(proposalsOnchain).values({
          id: "prop-1",
          txHash: "0xp1",
          daoId: "UNI",
          proposerAccountId: PROPOSER,
          targets: [],
          values: [],
          signatures: [],
          calldatas: [],
          startBlock: 1,
          endBlock: 2,
          title: "Proposal",
          description: "Proposal",
          timestamp: 1700000000n,
          endTimestamp: 1700100000n,
          status: "ACTIVE",
        });
      });

      const getFilteredTxHashes = async (address: string) => {
        const result = await repository.getFeedEvents(
          defaultFeedParams({ address: address as `0x${string}` }),
          defaultThresholds(),
        );
        return {
          txHashes: result.items.map((i) => i.txHash).sort(),
          totalCount: result.totalCount,
        };
      };

      it("matches delegation events by delegator, delegate, and previous delegate", async () => {
        expect(await getFilteredTxHashes(DELEGATOR)).toEqual({
          txHashes: ["0xd1"],
          totalCount: 1,
        });
        expect(await getFilteredTxHashes(DELEGATE)).toEqual({
          txHashes: ["0xd1"],
          totalCount: 1,
        });
        expect(await getFilteredTxHashes(PREVIOUS_DELEGATE)).toEqual({
          txHashes: ["0xd1"],
          totalCount: 1,
        });
      });

      it("matches transfer events by sender and recipient", async () => {
        expect(await getFilteredTxHashes(SENDER)).toEqual({
          txHashes: ["0xt1"],
          totalCount: 1,
        });
        expect(await getFilteredTxHashes(RECIPIENT)).toEqual({
          txHashes: ["0xt1"],
          totalCount: 1,
        });
      });

      it("matches vote events by voter", async () => {
        expect(await getFilteredTxHashes(VOTER)).toEqual({
          txHashes: ["0xv1"],
          totalCount: 1,
        });
      });

      it("matches proposal and proposal-extended events by proposer", async () => {
        expect(await getFilteredTxHashes(PROPOSER)).toEqual({
          txHashes: ["0xe1", "0xp1"],
          totalCount: 2,
        });
      });

      it("matches case-insensitively regardless of stored casing", async () => {
        expect(
          await getFilteredTxHashes(
            DELEGATOR.toUpperCase().replace("0X", "0x"),
          ),
        ).toEqual({
          txHashes: ["0xd1"],
          totalCount: 1,
        });
        expect(await getFilteredTxHashes(VOTER.toLowerCase())).toEqual({
          txHashes: ["0xv1"],
          totalCount: 1,
        });
      });

      it("returns nothing for an address not present in any event", async () => {
        expect(
          await getFilteredTxHashes(
            "0x9999999999999999999999999999999999999999",
          ),
        ).toEqual({ txHashes: [], totalCount: 0 });
      });

      it("combines with the type filter", async () => {
        const result = await repository.getFeedEvents(
          defaultFeedParams({
            address: DELEGATOR as `0x${string}`,
            type: [FeedEventType.TRANSFER],
          }),
          defaultThresholds(),
        );

        expect(result.items).toHaveLength(0);
        expect(result.totalCount).toBe(0);
      });
    });
  });
});
