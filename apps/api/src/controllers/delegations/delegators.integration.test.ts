import { describe, it, expect, beforeEach } from "vitest";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { Address } from "viem";
import { delegators } from "./delegators";
import {
  DelegatorsService,
  DelegatorsSortOptions,
} from "@/services/delegations/delegators";
import { AggregatedDelegator } from "@/mappers";

class FakeDelegatorsRepository {
  private items: AggregatedDelegator[] = [];
  private count = 0;

  setData(items: AggregatedDelegator[], totalCount?: number) {
    this.items = items;
    this.count = totalCount ?? items.length;
  }

  async getDelegators(
    _address: Address,
    _skip: number,
    _limit: number,
    _sort: DelegatorsSortOptions,
  ): Promise<{ items: AggregatedDelegator[]; totalCount: number }> {
    return {
      items: this.items,
      totalCount: this.count,
    };
  }
}

const createMockAggregatedDelegator = (
  overrides: Partial<AggregatedDelegator> = {},
): AggregatedDelegator => ({
  delegatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  amount: 1000000000000000000n,
  timestamp: 1700000000n,
  ...overrides,
});

function createTestApp(service: DelegatorsService) {
  const app = new Hono();
  delegators(app, service);
  return app;
}

const VALID_ADDRESS = "0x1234567890123456789012345678901234567890";

describe("Delegators Controller - Integration Tests", () => {
  let fakeRepo: FakeDelegatorsRepository;
  let service: DelegatorsService;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    fakeRepo = new FakeDelegatorsRepository();
    service = new DelegatorsService(fakeRepo);
    app = createTestApp(service);
  });

  describe(`GET /accounts/:address/delegators`, () => {
    it("should return 200 with correct response shape for a valid address", async () => {
      const delegator = createMockAggregatedDelegator();
      fakeRepo.setData([delegator]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: delegator.delegatorAddress,
            amount: delegator.amount.toString(),
            timestamp: delegator.timestamp.toString(),
          },
        ],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items and totalCount 0 when no delegators exist", async () => {
      fakeRepo.setData([]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should return 200 with multiple delegators", async () => {
      fakeRepo.setData([
        createMockAggregatedDelegator({
          delegatorAddress:
            "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
          amount: 1000000000000000000n,
          timestamp: 1700000000n,
        }),
        createMockAggregatedDelegator({
          delegatorAddress:
            "0x1111111111111111111111111111111111111111" as Address,
          amount: 2000000000000000000n,
          timestamp: 1700001000n,
        }),
      ]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      expect(body.totalCount).toBe(2);
    });

    it("should return totalCount from repository even when paginated", async () => {
      fakeRepo.setData([createMockAggregatedDelegator()], 50);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegators?skip=0&limit=1`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(50);
      expect(body.items).toHaveLength(1);
    });

    it("should accept skip and limit query parameters", async () => {
      fakeRepo.setData([createMockAggregatedDelegator()], 10);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegators?skip=5&limit=3`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(10);
    });

    it("should use default skip=0 and limit=10 when not provided", async () => {
      fakeRepo.setData([]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);

      expect(res.status).toBe(200);
    });

    it("should return 400 for an invalid address", async () => {
      const res = await app.request("/accounts/not-a-valid-address/delegators");

      expect(res.status).toBe(400);
    });

    it("should return 400 for a limit exceeding 100", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegators?limit=101`,
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 for a negative skip value", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegators?skip=-1`,
      );

      expect(res.status).toBe(400);
    });

    it("should checksum the address from the path parameter", async () => {
      fakeRepo.setData([createMockAggregatedDelegator()]);
      const lowercaseAddress = VALID_ADDRESS.toLowerCase();

      const res = await app.request(`/accounts/${lowercaseAddress}/delegators`);

      expect(res.status).toBe(200);
    });

    it("should serialize amount and timestamp as strings in response items", async () => {
      fakeRepo.setData([
        createMockAggregatedDelegator({
          amount: 999999999999999999n,
          timestamp: 1234567890n,
        }),
      ]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);
      const body = await res.json();

      expect(typeof body.items[0]?.amount).toBe("string");
      expect(typeof body.items[0]?.timestamp).toBe("string");
      expect(body.items[0]?.amount).toBe("999999999999999999");
      expect(body.items[0]?.timestamp).toBe("1234567890");
    });
  });
});
