import { parseEther } from "viem";
import { describe, it, expect, beforeEach } from "vitest";

import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import { DBFeedEvent, FeedRequest } from "@/mappers";

import { FeedService } from ".";

const createFeedEvent = (
  overrides: Partial<DBFeedEvent> = {},
): DBFeedEvent => ({
  txHash: "0xabc123",
  logIndex: 0,
  type: "VOTE",
  value: parseEther("100000"),
  timestamp: 1700000000,
  metadata: null,
  ...overrides,
});

const createRequest = (overrides: Partial<FeedRequest> = {}): FeedRequest => ({
  skip: 0,
  limit: 10,
  orderBy: "timestamp",
  orderDirection: "desc",
  relevance: FeedRelevance.MEDIUM,
  ...overrides,
});

class SimpleFeedRepository {
  items: DBFeedEvent[] = [];

  async getFeedEvents(
    _req: FeedRequest,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ) {
    const filtered = this.items.filter((e) => {
      if (e.type === "DELEGATION_VOTES_CHANGED") return false;
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
        type: "DELEGATION",
        value: ensThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM],
        timestamp: 1700001000,
        metadata: { from: "0x1", to: "0x2" },
      });
      simpleRepo.items = [event];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]).toEqual({
        txHash: "0xdef456",
        logIndex: 5,
        type: "DELEGATION",
        value: event.value.toString(),
        timestamp: 1700001000,
        metadata: { from: "0x1", to: "0x2" },
        relevance: FeedRelevance.MEDIUM,
      });
    });

    it("should assign HIGH relevance for PROPOSAL type", async () => {
      simpleRepo.items = [createFeedEvent({ type: "PROPOSAL", value: 0n })];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.HIGH);
    });

    it("should assign HIGH relevance when value >= HIGH threshold", async () => {
      const highThreshold =
        ensThresholds[FeedEventType.VOTE][FeedRelevance.HIGH];
      simpleRepo.items = [
        createFeedEvent({ type: "VOTE", value: highThreshold }),
      ];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.HIGH);
    });

    it("should assign MEDIUM relevance when value is between MEDIUM and HIGH thresholds", async () => {
      const mediumThreshold =
        ensThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      simpleRepo.items = [
        createFeedEvent({ type: "VOTE", value: mediumThreshold }),
      ];

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.MEDIUM);
    });

    it("should assign LOW relevance when value is below MEDIUM threshold", async () => {
      const lowThreshold = ensThresholds[FeedEventType.VOTE][FeedRelevance.LOW];
      simpleRepo.items = [
        createFeedEvent({ type: "VOTE", value: lowThreshold }),
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
          type: "TRANSFER",
          value: t[FeedRelevance.HIGH],
          logIndex: 0,
        }),
        createFeedEvent({
          type: "TRANSFER",
          value: t[FeedRelevance.MEDIUM],
          logIndex: 1,
        }),
        createFeedEvent({
          type: "TRANSFER",
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
          type: "VOTE",
          value: parseEther("500"),
          logIndex: 0,
        }),
        createFeedEvent({
          type: "VOTE",
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
        createFeedEvent({ type: "VOTE", value: 5n, logIndex: 0 }),
        createFeedEvent({ type: "VOTE", value: 20n, logIndex: 1 }),
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
