import { describe, it, expect, beforeEach } from "vitest";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { parseEther } from "viem";
import { feed } from ".";
import { FeedService } from "@/services/feed";
import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { DBFeedEvent, FeedRequest } from "@/mappers";

class FakeFeedRepository {
  private items: DBFeedEvent[] = [];
  private totalCount = 0;

  setData(items: DBFeedEvent[], totalCount?: number) {
    this.items = items;
    this.totalCount = totalCount ?? items.length;
  }

  async getFeedEvents(
    req: FeedRequest,
    _valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ) {
    let filtered = this.items;

    if (req.type != null) {
      filtered = filtered.filter((i) => i.type === req.type);
    }
    if (req.fromDate != null) {
      filtered = filtered.filter((i) => i.timestamp >= req.fromDate!);
    }
    if (req.toDate != null) {
      filtered = filtered.filter((i) => i.timestamp <= req.toDate!);
    }

    return {
      items: filtered,
      totalCount: this.totalCount,
    };
  }
}

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

function createTestApp(service: FeedService) {
  const app = new Hono();
  feed(app, service);
  return app;
}

describe("Feed Controller - Integration Tests", () => {
  let fakeRepo: FakeFeedRepository;
  let service: FeedService;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    fakeRepo = new FakeFeedRepository();
    service = new FeedService(DaoIdEnum.ENS, fakeRepo);
    app = createTestApp(service);
  });

  describe("GET /feed/events", () => {
    it("should return 200 with valid response structure", async () => {
      const event = createMockEvent();
      fakeRepo.setData([event]);

      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            txHash: event.txHash,
            logIndex: event.logIndex,
            type: event.type,
            value: event.value.toString(),
            timestamp: event.timestamp,
            metadata: event.metadata,
            relevance: FeedRelevance.MEDIUM,
          },
        ],
        totalCount: 1,
      });
    });

    it("should return value as string", async () => {
      const value = parseEther("12345");
      fakeRepo.setData([createMockEvent({ value })]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.value).toBe(value.toString());
    });

    it("should return empty items when no data available", async () => {
      fakeRepo.setData([]);

      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should include relevance in each item", async () => {
      fakeRepo.setData([
        createMockEvent({ type: "PROPOSAL", value: 0n }),
      ]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.relevance).toBe(FeedRelevance.HIGH);
    });

    it("should return only items matching the type filter when mixed types exist", async () => {
      fakeRepo.setData([
        createMockEvent({ type: "VOTE", logIndex: 0 }),
        createMockEvent({ type: "DELEGATION", logIndex: 1 }),
        createMockEvent({ type: "TRANSFER", logIndex: 2 }),
      ]);

      const res = await app.request("/feed/events?type=DELEGATION");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]?.type).toBe("DELEGATION");
    });

    it("should include PROPOSAL_EXTENDED events when no type filter is applied", async () => {
      fakeRepo.setData([
        createMockEvent({ type: "PROPOSAL_EXTENDED", value: 0n, logIndex: 0 }),
        createMockEvent({ type: "VOTE", logIndex: 1 }),
      ]);

      const res = await app.request("/feed/events");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      const types = body.items.map((i: { type: string }) => i.type);
      expect(types).toContain("PROPOSAL_EXTENDED");
    });

    it("should return only PROPOSAL_EXTENDED items when type=PROPOSAL_EXTENDED filter is applied", async () => {
      fakeRepo.setData([
        createMockEvent({ type: "PROPOSAL_EXTENDED", value: 0n, logIndex: 0 }),
        createMockEvent({ type: "VOTE", logIndex: 1 }),
        createMockEvent({ type: "PROPOSAL", value: 0n, logIndex: 2 }),
      ]);

      const res = await app.request("/feed/events?type=PROPOSAL_EXTENDED");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]?.type).toBe("PROPOSAL_EXTENDED");
    });

    it("should accept pagination query parameters", async () => {
      fakeRepo.setData(
        [createMockEvent({ logIndex: 0 })],
        5,
      );

      const res = await app.request("/feed/events?skip=2&limit=1");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(5);
    });

    it("should accept ordering query parameters", async () => {
      fakeRepo.setData([createMockEvent()]);

      const res = await app.request(
        "/feed/events?orderBy=value&orderDirection=asc",
      );

      expect(res.status).toBe(200);
    });

    it("should accept relevance query parameter", async () => {
      fakeRepo.setData([createMockEvent()]);

      const res = await app.request("/feed/events?relevance=HIGH");

      expect(res.status).toBe(200);
    });

    it("should accept date range query parameters", async () => {
      fakeRepo.setData([
        createMockEvent({ timestamp: 1700000000 }),
        createMockEvent({ timestamp: 1698000000, logIndex: 1 }),
        createMockEvent({ timestamp: 1702000000, logIndex: 2 }),
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
      fakeRepo.setData([createMockEvent({ type: "PROPOSAL", metadata })]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should handle null metadata", async () => {
      fakeRepo.setData([createMockEvent({ metadata: null })]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toBeNull();
    });

    it("should handle empty metadata object", async () => {
      fakeRepo.setData([createMockEvent({ metadata: {} })]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual({});
    });

    it("should preserve VOTE metadata shape", async () => {
      const metadata = {
        reason: "I support this proposal",
        support: 1,
        votingPower: "50000000000000000000000",
        proposalId: "42",
      };
      fakeRepo.setData([createMockEvent({ type: "VOTE", metadata })]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should preserve DELEGATION metadata shape", async () => {
      const metadata = {
        delegator: "0x1234567890abcdef1234567890abcdef12345678",
        delegate: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        previousDelegate: "0x0000000000000000000000000000000000000000",
      };
      fakeRepo.setData([createMockEvent({ type: "DELEGATION", metadata })]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should preserve TRANSFER metadata shape", async () => {
      const metadata = {
        from: "0x1234567890abcdef1234567890abcdef12345678",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      };
      fakeRepo.setData([createMockEvent({ type: "TRANSFER", metadata })]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should preserve metadata with numeric values", async () => {
      const metadata = {
        delta: 1000,
        deltaMod: 1000,
        delegate: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      };
      fakeRepo.setData([
        createMockEvent({ type: "DELEGATION", metadata }),
      ]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(metadata);
    });

    it("should preserve different metadata per item in a mixed list", async () => {
      const proposalMeta = { id: "1", proposer: "0xabc", title: "Test" };
      const transferMeta = { from: "0x111", to: "0x222" };

      fakeRepo.setData([
        createMockEvent({
          type: "PROPOSAL",
          value: 0n,
          logIndex: 0,
          metadata: proposalMeta,
        }),
        createMockEvent({
          type: "TRANSFER",
          logIndex: 1,
          metadata: transferMeta,
        }),
        createMockEvent({
          type: "VOTE",
          logIndex: 2,
          metadata: null,
        }),
      ]);

      const res = await app.request("/feed/events");
      const body = await res.json();

      expect(body.items[0]?.metadata).toEqual(proposalMeta);
      expect(body.items[1]?.metadata).toEqual(transferMeta);
      expect(body.items[2]?.metadata).toBeNull();
    });
  });
});
