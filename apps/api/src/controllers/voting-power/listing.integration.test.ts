import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address, getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { accountPower, votingPowerHistory } from "@/database/schema";
import { VotingPowerRepository } from "@/repositories/voting-power/general";
import { VotingPowerService } from "@/services/voting-power";
import { votingPowers } from "./listing";

type AccountPowerInsert = typeof accountPower.$inferInsert;
type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;

const TEST_ACCOUNT_1 = getAddress(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
) as Address;
const TEST_ACCOUNT_2 = getAddress(
  "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
) as Address;
const DAO_ID = "test-dao";

const createAccountPowerRow = (
  overrides: Partial<AccountPowerInsert> = {},
): AccountPowerInsert => ({
  accountId: TEST_ACCOUNT_1,
  daoId: DAO_ID,
  votingPower: 1000n,
  votesCount: 5,
  proposalsCount: 2,
  delegationsCount: 3,
  lastVoteTimestamp: 0n,
  ...overrides,
});

const createHistoryRow = (
  overrides: Partial<VotingPowerHistoryInsert> = {},
): VotingPowerHistoryInsert => ({
  transactionHash:
    "0xabc1230000000000000000000000000000000000000000000000000000000000",
  daoId: DAO_ID,
  accountId: TEST_ACCOUNT_1,
  votingPower: 1000n,
  delta: 200n,
  deltaMod: 200n,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

// Base item for TEST_ACCOUNT_1 with no history (absoluteChange=0)
const BASE_ACCOUNT_POWER_ITEM = {
  accountId: TEST_ACCOUNT_1,
  votingPower: "1000",
  votesCount: 5,
  proposalsCount: 2,
  delegationsCount: 3,
  variation: { absoluteChange: "0", percentageChange: "0.00" },
};

let client: PGlite;
let db: Drizzle;
let app: Hono;

beforeAll(async () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  client = new PGlite();
  db = drizzle(client, { schema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(schema, db as any);
  await apply();

  const repo = new VotingPowerRepository(db);
  const service = new VotingPowerService(repo, repo);
  app = new Hono();
  votingPowers(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(votingPowerHistory);
  await db.delete(accountPower);
});

describe("Voting Powers Controller", () => {
  describe("GET /voting-powers", () => {
    it("should return 200 with correct response structure including variation", async () => {
      await db
        .insert(accountPower)
        .values(createAccountPowerRow({ votingPower: 1200n }));
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ delta: 200n }));

      const res = await app.request("/voting-powers");

      expect(res.status).toBe(200);
      const body = await res.json();
      // absoluteChange=200, votingPower=1200 → prev=1000, pct=ROUND(200/1000*100,2)=20.00
      expect(body).toEqual({
        items: [
          {
            accountId: TEST_ACCOUNT_1,
            votingPower: "1200",
            votesCount: 5,
            proposalsCount: 2,
            delegationsCount: 3,
            variation: { absoluteChange: "200", percentageChange: "20.00" },
          },
        ],
        totalCount: 1,
      });
    });

    it("should return empty items when no data available", async () => {
      const res = await app.request("/voting-powers");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should return zero variation when no history exists", async () => {
      await db.insert(accountPower).values(createAccountPowerRow());

      const res = await app.request("/voting-powers");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [BASE_ACCOUNT_POWER_ITEM], totalCount: 1 });
    });

    it("should accept pagination query parameters", async () => {
      await db.insert(accountPower).values(createAccountPowerRow());

      const res = await app.request("/voting-powers?skip=0&limit=5");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [BASE_ACCOUNT_POWER_ITEM], totalCount: 1 });
    });

    it("should accept orderBy=delegationsCount", async () => {
      await db
        .insert(accountPower)
        .values(createAccountPowerRow({ delegationsCount: 10 }));

      const res = await app.request("/voting-powers?orderBy=delegationsCount");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            ...BASE_ACCOUNT_POWER_ITEM,
            delegationsCount: 10,
          },
        ],
        totalCount: 1,
      });
    });

    it("should accept orderBy=variation", async () => {
      await db.insert(accountPower).values(createAccountPowerRow());
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ delta: 500n }));

      const res = await app.request("/voting-powers?orderBy=variation");

      expect(res.status).toBe(200);
      const body = await res.json();
      // absoluteChange=500, votingPower=1000 → prev=500, pct=ROUND(500/500*100,2)=100.00
      expect(body).toEqual({
        items: [
          {
            ...BASE_ACCOUNT_POWER_ITEM,
            variation: { absoluteChange: "500", percentageChange: "100.00" },
          },
        ],
        totalCount: 1,
      });
    });

    it("should accept orderBy=signedVariation", async () => {
      await db.insert(accountPower).values(createAccountPowerRow());
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ delta: -500n, deltaMod: 500n }));

      const res = await app.request("/voting-powers?orderBy=signedVariation");

      expect(res.status).toBe(200);
      const body = await res.json();
      // absoluteChange=-500, votingPower=1000 → prev=1500, pct=ROUND(-500/1500*100,2)=-33.33
      expect(body).toEqual({
        items: [
          {
            ...BASE_ACCOUNT_POWER_ITEM,
            variation: { absoluteChange: "-500", percentageChange: "-33.33" },
          },
        ],
        totalCount: 1,
      });
    });

    it("should accept orderDirection=asc", async () => {
      await db.insert(accountPower).values(createAccountPowerRow());

      const res = await app.request("/voting-powers?orderDirection=asc");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [BASE_ACCOUNT_POWER_ITEM], totalCount: 1 });
    });

    it("should return multiple items with variation data", async () => {
      await db.insert(accountPower).values([
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 2000n,
          votesCount: 10,
        }),
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_2,
          votingPower: 500n,
          delegationsCount: 7,
        }),
      ]);

      const res = await app.request("/voting-powers");

      expect(res.status).toBe(200);
      const body = await res.json();
      // Default order: votingPower desc → ACCOUNT_1 (2000) first, ACCOUNT_2 (500) second
      expect(body).toEqual({
        items: [
          { ...BASE_ACCOUNT_POWER_ITEM, votingPower: "2000", votesCount: 10 },
          { ...BASE_ACCOUNT_POWER_ITEM, accountId: TEST_ACCOUNT_2, votingPower: "500", delegationsCount: 7 },
        ],
        totalCount: 2,
      });
    });

    it("should accept address filtering", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPowerRow({ accountId: TEST_ACCOUNT_1 }),
          createAccountPowerRow({ accountId: TEST_ACCOUNT_2 }),
        ]);

      const res = await app.request(
        `/voting-powers?addresses=${TEST_ACCOUNT_1}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [BASE_ACCOUNT_POWER_ITEM], totalCount: 1 });
    });

    it("should accept fromDate and toDate query parameters", async () => {
      await db.insert(accountPower).values(createAccountPowerRow());

      const res = await app.request(
        "/voting-powers?fromDate=1700000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [BASE_ACCOUNT_POWER_ITEM], totalCount: 1 });
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
  });

  describe("GET /voting-powers/{accountId}", () => {
    it("should return account power data with variation", async () => {
      await db.insert(accountPower).values(
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 1000n,
        }),
      );
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ delta: 300n }));

      const res = await app.request(`/voting-powers/${TEST_ACCOUNT_1}`);

      expect(res.status).toBe(200);
      const body = await res.json();
      // absoluteChange=300, votingPower=1000 → prev=700, pct=ROUND(300/700*100,2)=42.86
      expect(body).toEqual({
        accountId: TEST_ACCOUNT_1,
        votingPower: "1000",
        votesCount: 5,
        proposalsCount: 2,
        delegationsCount: 3,
        variation: { absoluteChange: "300", percentageChange: "42.86" },
      });
    });

    it("should return zero variation for non-existent account", async () => {
      const res = await app.request(`/voting-powers/${TEST_ACCOUNT_1}`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        accountId: TEST_ACCOUNT_1,
        votingPower: "0",
        votesCount: 0,
        proposalsCount: 0,
        delegationsCount: 0,
        variation: {
          absoluteChange: "0",
          percentageChange: "0",
        },
      });
    });

    it("should accept fromDate and toDate query parameters", async () => {
      await db
        .insert(accountPower)
        .values(createAccountPowerRow({ accountId: TEST_ACCOUNT_1 }));

      const res = await app.request(
        `/voting-powers/${TEST_ACCOUNT_1}?fromDate=1700000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        ...BASE_ACCOUNT_POWER_ITEM,
        variation: { absoluteChange: "0", percentageChange: "0.00" },
      });
    });

    it("should return 400 for invalid address format", async () => {
      const res = await app.request("/voting-powers/not-an-address");

      expect(res.status).toBe(400);
    });
  });
});
