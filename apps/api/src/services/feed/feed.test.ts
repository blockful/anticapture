import { describe, it, expect, beforeEach, vi } from "vitest";
import { parseEther } from "viem";
import { FeedService } from ".";
import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { DBFeedEvent, FeedRequest } from "@/mappers";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";

const createMockEvent = (
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

describe("FeedService", () => {
  let service: FeedService;
  let mockRepo: {
    getFeedEvents: ReturnType<typeof vi.fn>;
  };

  const ensThresholds = getDaoRelevanceThreshold(DaoIdEnum.ENS);

  beforeEach(() => {
    mockRepo = {
      getFeedEvents: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    };

    service = new FeedService(DaoIdEnum.ENS, mockRepo);
  });

  describe("getFeedEvents", () => {
    it("should return empty response when no items exist", async () => {
      const result = await service.getFeedEvents(createRequest());

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should convert bigint value to string", async () => {
      const value = parseEther("50000");
      mockRepo.getFeedEvents.mockResolvedValue({
        items: [createMockEvent({ value })],
        totalCount: 1,
      });

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.value).toBe(value.toString());
    });

    it("should preserve item fields from repository", async () => {
      const event = createMockEvent({
        txHash: "0xdef456",
        logIndex: 5,
        type: "DELEGATION",
        timestamp: 1700001000,
        metadata: { from: "0x1", to: "0x2" },
      });
      mockRepo.getFeedEvents.mockResolvedValue({
        items: [event],
        totalCount: 1,
      });

      const result = await service.getFeedEvents(createRequest());

      expect(result).toEqual({
        items: [
          {
            txHash: "0xdef456",
            logIndex: 5,
            type: "DELEGATION",
            value: event.value.toString(),
            timestamp: 1700001000,
            metadata: { from: "0x1", to: "0x2" },
            relevance: FeedRelevance.MEDIUM,
          },
        ],
        totalCount: 1,
      });
    });

    it("should preserve totalCount from repository", async () => {
      mockRepo.getFeedEvents.mockResolvedValue({
        items: [createMockEvent()],
        totalCount: 42,
      });

      const result = await service.getFeedEvents(createRequest());

      expect(result.totalCount).toBe(42);
    });

    it("should assign HIGH relevance for PROPOSAL type", async () => {
      mockRepo.getFeedEvents.mockResolvedValue({
        items: [createMockEvent({ type: "PROPOSAL", value: 0n })],
        totalCount: 1,
      });

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.HIGH);
    });

    it("should assign HIGH relevance when value >= HIGH threshold", async () => {
      const highThreshold =
        ensThresholds[FeedEventType.VOTE][FeedRelevance.HIGH];
      mockRepo.getFeedEvents.mockResolvedValue({
        items: [createMockEvent({ type: "VOTE", value: highThreshold })],
        totalCount: 1,
      });

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.HIGH);
    });

    it("should assign MEDIUM relevance when value is between MEDIUM and HIGH thresholds", async () => {
      const mediumThreshold =
        ensThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM];
      mockRepo.getFeedEvents.mockResolvedValue({
        items: [createMockEvent({ type: "VOTE", value: mediumThreshold })],
        totalCount: 1,
      });

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.MEDIUM);
    });

    it("should assign LOW relevance when value is below MEDIUM threshold", async () => {
      const lowValue = parseEther("500");
      mockRepo.getFeedEvents.mockResolvedValue({
        items: [createMockEvent({ type: "VOTE", value: lowValue })],
        totalCount: 1,
      });

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.LOW);
    });

    it("should assign correct relevance for each event in a mixed list", async () => {
      const transferThreshold = ensThresholds[FeedEventType.TRANSFER];
      mockRepo.getFeedEvents.mockResolvedValue({
        items: [
          createMockEvent({
            type: "TRANSFER",
            value: transferThreshold[FeedRelevance.HIGH],
            logIndex: 0,
          }),
          createMockEvent({
            type: "TRANSFER",
            value: transferThreshold[FeedRelevance.MEDIUM],
            logIndex: 1,
          }),
          createMockEvent({
            type: "TRANSFER",
            value: 1n,
            logIndex: 2,
          }),
        ],
        totalCount: 3,
      });

      const result = await service.getFeedEvents(createRequest());

      expect(result.items[0]?.relevance).toBe(FeedRelevance.HIGH);
      expect(result.items[1]?.relevance).toBe(FeedRelevance.MEDIUM);
      expect(result.items[2]?.relevance).toBe(FeedRelevance.LOW);
    });

    it("should pass correct value thresholds to repository for MEDIUM relevance", async () => {
      await service.getFeedEvents(
        createRequest({ relevance: FeedRelevance.MEDIUM }),
      );

      expect(mockRepo.getFeedEvents).toHaveBeenCalledWith(expect.anything(), {
        [FeedEventType.TRANSFER]:
          ensThresholds[FeedEventType.TRANSFER][FeedRelevance.MEDIUM],
        [FeedEventType.DELEGATION]:
          ensThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM],
        [FeedEventType.VOTE]:
          ensThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM],
        [FeedEventType.DELEGATION_VOTES_CHANGED]:
          ensThresholds[FeedEventType.DELEGATION_VOTES_CHANGED][
            FeedRelevance.MEDIUM
          ],
      });
    });

    it("should pass correct value thresholds to repository for LOW relevance", async () => {
      await service.getFeedEvents(
        createRequest({ relevance: FeedRelevance.LOW }),
      );

      expect(mockRepo.getFeedEvents).toHaveBeenCalledWith(expect.anything(), {
        [FeedEventType.TRANSFER]:
          ensThresholds[FeedEventType.TRANSFER][FeedRelevance.LOW],
        [FeedEventType.DELEGATION]:
          ensThresholds[FeedEventType.DELEGATION][FeedRelevance.LOW],
        [FeedEventType.VOTE]:
          ensThresholds[FeedEventType.VOTE][FeedRelevance.LOW],
        [FeedEventType.DELEGATION_VOTES_CHANGED]:
          ensThresholds[FeedEventType.DELEGATION_VOTES_CHANGED][
            FeedRelevance.LOW
          ],
      });
    });

    it("should use NOUNS thresholds for NOUNS dao", async () => {
      const nounsService = new FeedService(DaoIdEnum.NOUNS, mockRepo);
      const nounsThresholds = getDaoRelevanceThreshold(DaoIdEnum.NOUNS);

      await nounsService.getFeedEvents(
        createRequest({ relevance: FeedRelevance.MEDIUM }),
      );

      expect(mockRepo.getFeedEvents).toHaveBeenCalledWith(expect.anything(), {
        [FeedEventType.TRANSFER]:
          nounsThresholds[FeedEventType.TRANSFER][FeedRelevance.MEDIUM],
        [FeedEventType.DELEGATION]:
          nounsThresholds[FeedEventType.DELEGATION][FeedRelevance.MEDIUM],
        [FeedEventType.VOTE]:
          nounsThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM],
        [FeedEventType.DELEGATION_VOTES_CHANGED]:
          nounsThresholds[FeedEventType.DELEGATION_VOTES_CHANGED][
            FeedRelevance.MEDIUM
          ],
      });
    });
  });
});
