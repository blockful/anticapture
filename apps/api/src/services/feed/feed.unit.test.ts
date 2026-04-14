import { parseEther } from "viem";
import { describe, it, expect, beforeEach } from "vitest";

import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import { FeedItemMetadata, FeedRequest } from "@/mappers";
import type { DBFeedEventWithMetadata } from "@/repositories/feed";

import { FeedService } from ".";

const createFeedEvent = (
  overrides: Partial<Omit<DBFeedEventWithMetadata, "metadata">> & {
    metadata?: FeedItemMetadata;
  } = {},
): DBFeedEventWithMetadata => {
  const item = {
    txHash: "0xabc123",
    logIndex: 0,
    type: FeedEventType.VOTE,
    value: parseEther("100000"),
    timestamp: 1700000000,
    ...overrides,
  };

  switch (item.type) {
    case FeedEventType.VOTE:
      return {
        ...item,
        type: FeedEventType.VOTE,
        metadata: overrides.metadata ?? {
          voter: "0x0000000000000000000000000000000000000001",
          reason: null,
          support: 1,
          votingPower: item.value.toString(),
          proposalId: "1",
          title: "Test Proposal",
        },
      };
    case FeedEventType.DELEGATION:
      return {
        ...item,
        type: FeedEventType.DELEGATION,
        metadata: overrides.metadata ?? {
          delegator: "0x0000000000000000000000000000000000000001",
          delegate: "0x0000000000000000000000000000000000000002",
          previousDelegate: null,
          amount: item.value.toString(),
        },
      };
    case FeedEventType.TRANSFER:
      return {
        ...item,
        type: FeedEventType.TRANSFER,
        metadata: overrides.metadata ?? {
          from: "0x0000000000000000000000000000000000000001",
          to: "0x0000000000000000000000000000000000000002",
          amount: item.value.toString(),
        },
      };
    case FeedEventType.PROPOSAL:
      return {
        ...item,
        type: FeedEventType.PROPOSAL,
        metadata: overrides.metadata ?? {
          id: "1",
          proposer: "0x0000000000000000000000000000000000000001",
          votingPower: "100",
          title: "Test Proposal",
        },
      };
    case FeedEventType.PROPOSAL_EXTENDED:
      return {
        ...item,
        type: FeedEventType.PROPOSAL_EXTENDED,
        metadata: overrides.metadata ?? {
          id: "1",
          title: "Test Proposal",
          endBlock: 100,
          endTimestamp: "1700001000",
          proposer: "0x0000000000000000000000000000000000000001",
        },
      };
    default:
      throw new Error(`Unsupported test feed event type ${item.type}`);
  }
};

const createRequest = (overrides: Partial<FeedRequest> = {}): FeedRequest => ({
  skip: 0,
  limit: 10,
  orderBy: "timestamp",
  orderDirection: "desc",
  relevance: FeedRelevance.MEDIUM,
  ...overrides,
});

class SimpleFeedRepository {
  items: DBFeedEventWithMetadata[] = [];

  async getFeedEvents(
    _req: FeedRequest,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ) {
    const filtered = this.items.filter((e) => {
      const threshold = valueThresholds[e.type];
      return threshold === undefined || e.value >= threshold;
    });

    return {
      items: filtered,
      totalCount: filtered.length,
    };
  }
}

describe("FeedService", () => {
  let service: FeedService;
  let simpleRepo: SimpleFeedRepository;

  const ensThresholds = getDaoRelevanceThreshold(DaoIdEnum.ENS);

  beforeEach(() => {
    simpleRepo = new SimpleFeedRepository();
    service = new FeedService(DaoIdEnum.ENS, simpleRepo);
  });

  describe("getFeedEvents", () => {
    it("should return empty response when no items exist", async () => {
      const result = await service.getFeedEvents(createRequest());

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should convert bigint value to string", async () => {
      const value = parseEther("100000");
      simpleRepo.items = [createFeedEvent({ value })];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.value).toBe(value.toString());
    });

    it("should preserve item fields from repository", async () => {
      const event = createFeedEvent({
        txHash: "0xdef456",
        logIndex: 5,
        type: FeedEventType.DELEGATION,
        value: ensThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM],
        timestamp: 1700001000,
        metadata: {
          delegator: "0x0000000000000000000000000000000000000001",
          delegate: "0x0000000000000000000000000000000000000002",
          previousDelegate: null,
          amount: "100",
        },
      });
      simpleRepo.items = [event];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]).toEqual({
        txHash: "0xdef456",
        logIndex: 5,
        type: FeedEventType.DELEGATION,
        value: event.value.toString(),
        timestamp: 1700001000,
        metadata: {
          delegator: "0x0000000000000000000000000000000000000001",
          delegate: "0x0000000000000000000000000000000000000002",
          previousDelegate: null,
          amount: "100",
        },
        relevance: FeedRelevance.MEDIUM,
      });
    });

    it("should assign HIGH relevance for PROPOSAL type", async () => {
      simpleRepo.items = [
        createFeedEvent({ type: FeedEventType.PROPOSAL, value: 0n }),
      ];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.HIGH);
    });

    it("should assign HIGH relevance when value >= HIGH threshold", async () => {
      const highThreshold =
        ensThresholds[FeedEventType.VOTE][FeedRelevance.HIGH];
      simpleRepo.items = [
        createFeedEvent({ type: FeedEventType.VOTE, value: highThreshold }),
      ];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.HIGH);
    });

    it("should assign MEDIUM relevance when value is between MEDIUM and HIGH thresholds", async () => {
      const mediumThreshold =
        ensThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      simpleRepo.items = [
        createFeedEvent({ type: FeedEventType.VOTE, value: mediumThreshold }),
      ];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.MEDIUM);
    });

    it("should assign LOW relevance when value is below MEDIUM threshold", async () => {
      const lowThreshold = ensThresholds[FeedEventType.VOTE][FeedRelevance.LOW];
      simpleRepo.items = [
        createFeedEvent({ type: FeedEventType.VOTE, value: lowThreshold }),
      ];

      const result = await service.getFeedEvents(
        createRequest({ relevance: FeedRelevance.LOW }),
      );

      expect(result.items[0]?.relevance).toBe(FeedRelevance.LOW);
    });

    it("should assign correct relevance for each event in a mixed list", async () => {
      const t = ensThresholds[FeedEventType.TRANSFER];
      simpleRepo.items = [
        createFeedEvent({
          type: FeedEventType.TRANSFER,
          value: t[FeedRelevance.HIGH],
          logIndex: 0,
        }),
        createFeedEvent({
          type: FeedEventType.TRANSFER,
          value: t[FeedRelevance.MEDIUM],
          logIndex: 1,
        }),
        createFeedEvent({
          type: FeedEventType.TRANSFER,
          value: t[FeedRelevance.LOW],
          logIndex: 2,
        }),
      ];

      const result = await service.getFeedEvents(
        createRequest({ relevance: FeedRelevance.LOW }),
      );

      expect(result.items[0]?.relevance).toBe(FeedRelevance.HIGH);
      expect(result.items[1]?.relevance).toBe(FeedRelevance.MEDIUM);
      expect(result.items[2]?.relevance).toBe(FeedRelevance.LOW);
    });

    it("should filter out events below the relevance threshold", async () => {
      simpleRepo.items = [
        createFeedEvent({
          type: FeedEventType.VOTE,
          value: parseEther("500"),
          logIndex: 0,
        }),
        createFeedEvent({
          type: FeedEventType.VOTE,
          value: ensThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM],
          logIndex: 1,
        }),
      ];

      const result = await service.getFeedEvents(
        createRequest({ relevance: FeedRelevance.MEDIUM }),
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.relevance).toBe(FeedRelevance.MEDIUM);
    });

    it("should use NOUNS thresholds for NOUNS dao", async () => {
      const nounsService = new FeedService(DaoIdEnum.NOUNS, simpleRepo);
      simpleRepo.items = [
        createFeedEvent({ type: FeedEventType.VOTE, value: 5n, logIndex: 0 }),
        createFeedEvent({ type: FeedEventType.VOTE, value: 20n, logIndex: 1 }),
      ];

      const result = await nounsService.getFeedEvents(
        createRequest({ relevance: FeedRelevance.MEDIUM }),
      );

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.relevance).toBe(FeedRelevance.MEDIUM);
      expect(result.items[1]?.relevance).toBe(FeedRelevance.HIGH);
    });
  });
});
