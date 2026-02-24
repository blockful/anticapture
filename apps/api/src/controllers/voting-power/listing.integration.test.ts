import { describe, it, expect, beforeEach } from "vitest";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { Address } from "viem";
import { votingPowers } from "./listing";
import { VotingPowerService } from "@/services/voting-power";
import {
  DBAccountPowerWithVariation,
  DBVotingPowerVariation,
  DBHistoricalVotingPowerWithRelations,
  AmountFilter,
} from "@/mappers";

const TEST_ACCOUNT_1 = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const TEST_ACCOUNT_2 = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" as Address;

function createAccountPower(
  overrides: Partial<DBAccountPowerWithVariation> = {},
): DBAccountPowerWithVariation {
  return {
    accountId: TEST_ACCOUNT_1,
    daoId: "test-dao",
    votingPower: 1000n,
    votesCount: 5,
    proposalsCount: 2,
    delegationsCount: 3,
    lastVoteTimestamp: 0n,
    absoluteChange: 200n,
    percentageChange: 25,
    ...overrides,
  };
}

class FakeVotingPowersRepository {
  private items: DBAccountPowerWithVariation[] = [];
  private totalCount = 0;
  private singleAccount: DBAccountPowerWithVariation | null = null;

  setData(items: DBAccountPowerWithVariation[], totalCount?: number) {
    this.items = items;
    this.totalCount = totalCount ?? items.length;
  }

  setSingleAccount(account: DBAccountPowerWithVariation) {
    this.singleAccount = account;
  }

  async getVotingPowers(
    _skip: number,
    _limit: number,
    _orderDirection: "asc" | "desc",
    _orderBy: "votingPower" | "delegationsCount" | "variation",
    _amountFilter: AmountFilter,
    _addresses: Address[],
    _fromDate?: number,
    _toDate?: number,
  ): Promise<{
    items: DBAccountPowerWithVariation[];
    totalCount: number;
  }> {
    return { items: this.items, totalCount: this.totalCount };
  }

  async getVotingPowersByAccountId(
    accountId: Address,
  ): Promise<DBAccountPowerWithVariation> {
    if (this.singleAccount) return this.singleAccount;
    return createAccountPower({
      accountId,
      votingPower: 0n,
      votesCount: 0,
      proposalsCount: 0,
      delegationsCount: 0,
      absoluteChange: 0n,
      percentageChange: 0,
    });
  }

  async getVotingPowerVariations(
    _startTimestamp: number | undefined,
    _endTimestamp: number | undefined,
    _skip: number,
    _limit: number,
    _orderDirection: "asc" | "desc",
    _addresses?: Address[],
  ): Promise<DBVotingPowerVariation[]> {
    return [];
  }

  async getVotingPowerVariationsByAccountId(
    accountId: Address,
    _startTimestamp: number | undefined,
    _endTimestamp: number | undefined,
  ): Promise<DBVotingPowerVariation> {
    return {
      accountId,
      previousVotingPower: 0n,
      currentVotingPower: 0n,
      absoluteChange: 0n,
      percentageChange: "0",
    };
  }
}

class FakeHistoricalVotingPowerRepository {
  async getHistoricalVotingPowers(): Promise<
    DBHistoricalVotingPowerWithRelations[]
  > {
    return [];
  }

  async getHistoricalVotingPowerCount(): Promise<number> {
    return 0;
  }
}

function createTestApp(service: VotingPowerService) {
  const app = new Hono();
  votingPowers(app, service);
  return app;
}

describe("Voting Powers Controller - Integration Tests", () => {
  let fakeRepo: FakeVotingPowersRepository;
  let service: VotingPowerService;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    fakeRepo = new FakeVotingPowersRepository();
    service = new VotingPowerService(
      new FakeHistoricalVotingPowerRepository(),
      fakeRepo,
    );
    app = createTestApp(service);
  });

  describe("GET /voting-powers", () => {
    it("should return 200 with correct response structure including variation", async () => {
      const account = createAccountPower({
        absoluteChange: 200n,
        percentageChange: 25,
      });
      fakeRepo.setData([account]);

      const res = await app.request("/voting-powers");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: [
          {
            accountId: account.accountId,
            votingPower: account.votingPower.toString(),
            votesCount: account.votesCount,
            proposalsCount: account.proposalsCount,
            delegationsCount: account.delegationsCount,
            variation: {
              absoluteChange: "200",
              percentageChange: 25,
            },
          },
        ],
        totalCount: 1,
      });
    });

    it("should return empty items when no data available", async () => {
      fakeRepo.setData([]);

      const res = await app.request("/voting-powers");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should accept pagination query parameters", async () => {
      fakeRepo.setData([createAccountPower()], 10);

      const res = await app.request("/voting-powers?skip=2&limit=5");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(10);
    });

    it("should accept orderBy=delegationsCount", async () => {
      const account = createAccountPower({ delegationsCount: 10 });
      fakeRepo.setData([account]);

      const res = await app.request("/voting-powers?orderBy=delegationsCount");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].delegationsCount).toBe(10);
    });

    it("should accept orderBy=variation", async () => {
      const account = createAccountPower({
        absoluteChange: 500n,
        percentageChange: 50,
      });
      fakeRepo.setData([account]);

      const res = await app.request("/voting-powers?orderBy=variation");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].variation.absoluteChange).toBe("500");
    });

    it("should accept orderDirection=asc", async () => {
      const account = createAccountPower();
      fakeRepo.setData([account]);

      const res = await app.request("/voting-powers?orderDirection=asc");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].accountId).toBe(account.accountId);
    });

    it("should return multiple items with variation data", async () => {
      const testAccount1 = createAccountPower({
        accountId: TEST_ACCOUNT_1,
        votingPower: 2000n,
        votesCount: 10,
        absoluteChange: 500n,
        percentageChange: 33.33,
      });
      const testAccount2 = createAccountPower({
        accountId: TEST_ACCOUNT_2,
        votingPower: 500n,
        delegationsCount: 7,
        absoluteChange: -100n,
        percentageChange: -16.67,
      });
      fakeRepo.setData([testAccount1, testAccount2]);

      const res = await app.request("/voting-powers");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      expect(body.items[0].accountId).toBe(TEST_ACCOUNT_1);
      expect(body.items[0].variation).toEqual({
        absoluteChange: "500",
        percentageChange: 33.33,
      });
      expect(body.items[1].accountId).toBe(TEST_ACCOUNT_2);
      expect(body.items[1].variation).toEqual({
        absoluteChange: "-100",
        percentageChange: -16.67,
      });
      expect(body.totalCount).toBe(2);
    });

    it("should accept address filtering", async () => {
      const account = createAccountPower({ accountId: TEST_ACCOUNT_1 });
      fakeRepo.setData([account]);

      const res = await app.request(
        `/voting-powers?addresses=${TEST_ACCOUNT_1}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].accountId).toBe(TEST_ACCOUNT_1);
    });

    it("should accept fromDate and toDate query parameters", async () => {
      const account = createAccountPower();
      fakeRepo.setData([account]);

      const res = await app.request(
        "/voting-powers?fromDate=1700000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.totalCount).toBe(1);
    });

    it("should return 400 for limit exceeding 100", async () => {
      const res = await app.request("/voting-powers?limit=200");

      expect(res.status).toBe(400);
    });

    it("should return 400 for negative skip", async () => {
      const res = await app.request("/voting-powers?skip=-1");

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid orderBy value", async () => {
      const res = await app.request("/voting-powers?orderBy=invalid");

      expect(res.status).toBe(400);
    });

    it("should return zero variation for accounts with no changes", async () => {
      const account = createAccountPower({
        absoluteChange: 0n,
        percentageChange: 0,
      });
      fakeRepo.setData([account]);

      const res = await app.request("/voting-powers");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items[0].variation).toEqual({
        absoluteChange: "0",
        percentageChange: 0,
      });
    });
  });

  describe("GET /voting-powers/{accountId}", () => {
    it("should return account power data with variation", async () => {
      const account = createAccountPower({
        accountId: TEST_ACCOUNT_1,
        absoluteChange: 300n,
        percentageChange: 42.86,
      });
      fakeRepo.setSingleAccount(account);

      const res = await app.request(`/voting-powers/${TEST_ACCOUNT_1}`);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        accountId: account.accountId,
        votingPower: account.votingPower.toString(),
        votesCount: account.votesCount,
        proposalsCount: account.proposalsCount,
        delegationsCount: account.delegationsCount,
        variation: {
          absoluteChange: "300",
          percentageChange: 42.86,
        },
      });
    });

    it("should return zero variation for non-existent account", async () => {
      const res = await app.request(`/voting-powers/${TEST_ACCOUNT_1}`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.votingPower).toBe("0");
      expect(body.variation).toEqual({
        absoluteChange: "0",
        percentageChange: 0,
      });
    });

    it("should return negative variation for account that lost voting power", async () => {
      const account = createAccountPower({
        accountId: TEST_ACCOUNT_1,
        votingPower: 500n,
        absoluteChange: -300n,
        percentageChange: -37.5,
      });
      fakeRepo.setSingleAccount(account);

      const res = await app.request(`/voting-powers/${TEST_ACCOUNT_1}`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.variation).toEqual({
        absoluteChange: "-300",
        percentageChange: -37.5,
      });
    });

    it("should return 400 for invalid address format", async () => {
      const res = await app.request("/voting-powers/not-an-address");

      expect(res.status).toBe(400);
    });
  });
});
