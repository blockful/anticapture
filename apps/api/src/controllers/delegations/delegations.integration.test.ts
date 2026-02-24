import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { Address } from "viem";
import { describe, it, expect, beforeEach } from "vitest";

import { DBDelegation, DelegationsRequestQuery } from "@/mappers";
import { DelegationsService } from "@/services/delegations/current";

import { delegations } from "./delegations";

class FakeDelegationsRepository {
  private items: DBDelegation[] = [];

  setData(items: DBDelegation[]) {
    this.items = items;
  }

  async getDelegations(
    _address: Address,
    _sort: DelegationsRequestQuery,
  ): Promise<DBDelegation[]> {
    return this.items;
  }
}

const createMockDBDelegation = (
  overrides: Partial<DBDelegation> = {},
): DBDelegation => ({
  transactionHash:
    "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd",
  daoId: "uni",
  delegateAccountId: "0x1234567890123456789012345678901234567890" as Address,
  delegatorAccountId: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  delegatedValue: 1000000000000000000n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

function createTestApp(service: DelegationsService) {
  const app = new Hono();
  delegations(app, service);
  return app;
}

const VALID_ADDRESS = "0x1234567890123456789012345678901234567890";

describe("Delegations Controller - Integration Tests", () => {
  let fakeRepo: FakeDelegationsRepository;
  let service: DelegationsService;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    fakeRepo = new FakeDelegationsRepository();
    service = new DelegationsService(fakeRepo);
    app = createTestApp(service);
  });

  describe(`GET /accounts/:address/delegations`, () => {
    it("should return 200 with correct response shape for a valid address", async () => {
      const delegation = createMockDBDelegation();
      fakeRepo.setData([delegation]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: delegation.delegatorAccountId,
            delegateAddress: delegation.delegateAccountId,
            amount: delegation.delegatedValue.toString(),
            timestamp: delegation.timestamp.toString(),
            transactionHash: delegation.transactionHash,
          },
        ],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items and totalCount 0 when no delegations exist", async () => {
      fakeRepo.setData([]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should return 200 with multiple delegations", async () => {
      fakeRepo.setData([
        createMockDBDelegation({
          delegatorAccountId:
            "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
          delegatedValue: 1000000000000000000n,
          timestamp: 1700000000n,
        }),
        createMockDBDelegation({
          delegatorAccountId:
            "0x1111111111111111111111111111111111111111" as Address,
          delegatedValue: 2000000000000000000n,
          timestamp: 1700001000n,
          transactionHash:
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        }),
      ]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      expect(body.totalCount).toBe(2);
    });

    it("should return 400 for an invalid address", async () => {
      const res = await app.request(
        "/accounts/not-a-valid-address/delegations",
      );

      expect(res.status).toBe(400);
    });

    it("should checksum the address from the path parameter", async () => {
      fakeRepo.setData([createMockDBDelegation()]);
      const lowercaseAddress = VALID_ADDRESS.toLowerCase();

      const res = await app.request(
        `/accounts/${lowercaseAddress}/delegations`,
      );

      expect(res.status).toBe(200);
    });

    it("should accept orderBy=amount query parameter", async () => {
      fakeRepo.setData([createMockDBDelegation()]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations?orderBy=amount`,
      );

      expect(res.status).toBe(200);
    });

    it("should accept orderBy=timestamp query parameter", async () => {
      fakeRepo.setData([createMockDBDelegation()]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations?orderBy=timestamp`,
      );

      expect(res.status).toBe(200);
    });

    it("should accept orderDirection=asc query parameter", async () => {
      fakeRepo.setData([createMockDBDelegation()]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations?orderDirection=asc`,
      );

      expect(res.status).toBe(200);
    });

    it("should accept orderDirection=desc query parameter", async () => {
      fakeRepo.setData([createMockDBDelegation()]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations?orderDirection=desc`,
      );

      expect(res.status).toBe(200);
    });

    it("should return 400 for an invalid orderBy value", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations?orderBy=invalid`,
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 for an invalid orderDirection value", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations?orderDirection=invalid`,
      );

      expect(res.status).toBe(400);
    });

    it("should serialize amount and timestamp as strings in response items", async () => {
      fakeRepo.setData([
        createMockDBDelegation({
          delegatedValue: 999999999999999999n,
          timestamp: 1234567890n,
        }),
      ]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);
      const body = await res.json();

      expect(typeof body.items[0]?.amount).toBe("string");
      expect(typeof body.items[0]?.timestamp).toBe("string");
      expect(body.items[0]?.amount).toBe("999999999999999999");
      expect(body.items[0]?.timestamp).toBe("1234567890");
    });

    it("should include transactionHash in response items", async () => {
      const txHash =
        "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
      fakeRepo.setData([createMockDBDelegation({ transactionHash: txHash })]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);
      const body = await res.json();

      expect(body.items[0]?.transactionHash).toBe(txHash);
    });

    it("should use default orderBy=timestamp and orderDirection=desc when not provided", async () => {
      fakeRepo.setData([]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);

      expect(res.status).toBe(200);
    });
  });
});
