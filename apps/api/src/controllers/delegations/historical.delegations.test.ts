import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { Address, getAddress } from "viem";
import { describe, it, expect, beforeEach } from "vitest";

import { DBDelegation } from "@/mappers";
import { HistoricalDelegationsService } from "@/services/delegations";

import { historicalDelegations } from "./historical";

class FakeHistoricalDelegationsRepository {
  private items: DBDelegation[] = [];
  private count = 0;

  setData(items: DBDelegation[], totalCount?: number) {
    this.items = items;
    this.count = totalCount ?? items.length;
  }

  async getHistoricalDelegations(
    _address: Address,
    _orderDirection: "asc" | "desc",
    _skip: number,
    _limit: number,
    _fromValue: bigint | undefined,
    _toValue: bigint | undefined,
    _delegateAddressIn: Address[] | undefined,
  ): Promise<{ items: DBDelegation[]; totalCount: number }> {
    return {
      items: this.items,
      totalCount: this.count,
    };
  }
}

const createMockDelegationItem = (
  overrides: Partial<DBDelegation> = {},
): DBDelegation => ({
  daoId: "uni",
  delegatorAccountId: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  delegateAccountId: "0x1234567890123456789012345678901234567890",
  delegatedValue: 1000000000000000000n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  transactionHash:
    "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
  ...overrides,
});

function createTestApp(service: HistoricalDelegationsService) {
  const app = new Hono();
  historicalDelegations(app, service);
  return app;
}

const VALID_ADDRESS = "0x1234567890123456789012345678901234567890";

describe("Historical Delegations Controller - Integration Tests", () => {
  let fakeRepo: FakeHistoricalDelegationsRepository;
  let service: HistoricalDelegationsService;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    fakeRepo = new FakeHistoricalDelegationsRepository();
    service = new HistoricalDelegationsService(fakeRepo);
    app = createTestApp(service);
  });

  describe(`GET /accounts/:address/delegations/historical`, () => {
    it("should return 200 with correct response shape for a valid address", async () => {
      const item = createMockDelegationItem();
      fakeRepo.setData([item]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(item.delegatorAccountId),
            delegateAddress: getAddress(item.delegateAccountId),
            amount: item.delegatedValue.toString(),
            timestamp: item.timestamp.toString(),
            transactionHash: item.transactionHash,
          },
        ],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items and totalCount 0 when no delegations exist", async () => {
      fakeRepo.setData([]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should return 200 with multiple delegations", async () => {
      fakeRepo.setData([
        createMockDelegationItem({
          delegatorAccountId: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          delegatedValue: 1000000000000000000n,
          timestamp: 1700000000n,
        }),
        createMockDelegationItem({
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          delegatedValue: 2000000000000000000n,
          timestamp: 1700001000n,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      expect(body.totalCount).toBe(2);
    });

    it("should return totalCount from repository even when paginated", async () => {
      fakeRepo.setData([createMockDelegationItem()], 50);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?skip=0&limit=1`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(50);
      expect(body.items).toHaveLength(1);
    });

    it("should accept skip and limit query parameters", async () => {
      fakeRepo.setData([createMockDelegationItem()], 10);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?skip=5&limit=3`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(10);
    });

    it("should use default skip=0 and limit=10 when not provided", async () => {
      fakeRepo.setData([]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical`,
      );

      expect(res.status).toBe(200);
    });

    it("should return 400 for an invalid address", async () => {
      const res = await app.request(
        "/accounts/not-a-valid-address/delegations/historical",
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 for a limit exceeding 100", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?limit=101`,
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 for a negative skip value", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?skip=-1`,
      );

      expect(res.status).toBe(400);
    });

    it("should checksum the address from the path parameter", async () => {
      fakeRepo.setData([createMockDelegationItem()]);
      const lowercaseAddress = VALID_ADDRESS.toLowerCase();

      const res = await app.request(
        `/accounts/${lowercaseAddress}/delegations/historical`,
      );

      expect(res.status).toBe(200);
    });

    it("should serialize amount and timestamp as strings in response items", async () => {
      fakeRepo.setData([
        createMockDelegationItem({
          delegatedValue: 999999999999999999n,
          timestamp: 1234567890n,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical`,
      );
      const body = await res.json();

      expect(typeof body.items[0]?.amount).toBe("string");
      expect(typeof body.items[0]?.timestamp).toBe("string");
      expect(body.items[0]?.amount).toBe("999999999999999999");
      expect(body.items[0]?.timestamp).toBe("1234567890");
    });

    it("should accept orderDirection query parameter", async () => {
      fakeRepo.setData([createMockDelegationItem()]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?orderDirection=asc`,
      );

      expect(res.status).toBe(200);
    });

    it("should return 400 for an invalid orderDirection value", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?orderDirection=invalid`,
      );

      expect(res.status).toBe(400);
    });

    it("should accept fromValue and toValue query parameters", async () => {
      fakeRepo.setData([createMockDelegationItem()]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?fromValue=100&toValue=1000`,
      );

      expect(res.status).toBe(200);
    });

    it("should accept a single delegateAddressIn query parameter", async () => {
      fakeRepo.setData([createMockDelegationItem()]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?delegateAddressIn=${VALID_ADDRESS}`,
      );

      expect(res.status).toBe(200);
    });

    it("should return 400 for an invalid delegateAddressIn address", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?delegateAddressIn=not-an-address`,
      );

      expect(res.status).toBe(400);
    });
  });
});
