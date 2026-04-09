import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address, getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { delegation, accountBalance } from "@/database/schema";
import { DelegatorsRepository } from "@/repositories/delegations/delegators";
import { DelegatorsService } from "@/services/delegations/delegators";
import { delegators } from "./delegators";

type DelegationInsert = typeof delegation.$inferInsert;
type AccountBalanceInsert = typeof accountBalance.$inferInsert;

// VALID_ADDRESS is the delegatee (the one being delegated to)
const VALID_ADDRESS = getAddress(
  "0x1234567890123456789012345678901234567890",
) as Address;
const DELEGATOR_1 = getAddress(
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
) as Address;
const DELEGATOR_2 = getAddress(
  "0x1111111111111111111111111111111111111111",
) as Address;
const DAO_ID = "uni";

const createDelegationRow = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  id: "test-id",
  transactionHash:
    "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd",
  daoId: DAO_ID,
  delegateAccountId: VALID_ADDRESS,
  delegatorAccountId: DELEGATOR_1,
  delegatedValue: 0n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

const createAccountBalanceRow = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  id: "test-id",
  accountId: DELEGATOR_1,
  tokenId: "uni",
  balance: 1000000000000000000n,
  delegate: VALID_ADDRESS,
  ...overrides,
});

let client: PGlite;
let db: Drizzle;
let app: Hono;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(schema, db as any);
  await apply();

  const repo = new DelegatorsRepository(db);
  const service = new DelegatorsService(repo);
  app = new Hono();
  delegators(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(delegation);
  await db.delete(accountBalance);
});

describe("Delegators Controller", () => {
  describe("GET /accounts/:address/delegators", () => {
    it("should return 200 with correct response shape for a valid address", async () => {
      // DelegatorsRepository queries accountBalance WHERE delegate = address
      // and joins with delegation WHERE delegateAccountId = address
      await db.insert(delegation).values(
        createDelegationRow({
          delegateAccountId: VALID_ADDRESS,
          delegatorAccountId: DELEGATOR_1,
          logIndex: 0,
        }),
      );
      await db.insert(accountBalance).values(
        createAccountBalanceRow({
          accountId: DELEGATOR_1,
          delegate: VALID_ADDRESS,
          balance: 1000000000000000000n,
          tokenId: "uni",
        }),
      );

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(DELEGATOR_1),
            amount: "1000000000000000000",
            timestamp: "1700000000",
          },
        ],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items and totalCount 0 when no delegators exist", async () => {
      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should return 200 with multiple delegators", async () => {
      await db.insert(delegation).values([
        createDelegationRow({
          delegateAccountId: VALID_ADDRESS,
          delegatorAccountId: DELEGATOR_1,
          transactionHash:
            "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd",
          logIndex: 0,
          timestamp: 1700000000n,
        }),
        createDelegationRow({
          delegateAccountId: VALID_ADDRESS,
          delegatorAccountId: DELEGATOR_2,
          transactionHash:
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          logIndex: 0,
          timestamp: 1700001000n,
        }),
      ]);
      await db.insert(accountBalance).values([
        createAccountBalanceRow({
          accountId: DELEGATOR_1,
          delegate: VALID_ADDRESS,
          balance: 1000000000000000000n,
        }),
        createAccountBalanceRow({
          accountId: DELEGATOR_2,
          delegate: VALID_ADDRESS,
          balance: 2000000000000000000n,
        }),
      ]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(DELEGATOR_2),
            amount: "2000000000000000000",
            timestamp: "1700001000",
          },
          {
            delegatorAddress: getAddress(DELEGATOR_1),
            amount: "1000000000000000000",
            timestamp: "1700000000",
          },
        ],
        totalCount: 2,
      });
    });

    it("should accept skip and limit query parameters", async () => {
      await db.insert(delegation).values(
        createDelegationRow({
          delegateAccountId: VALID_ADDRESS,
          delegatorAccountId: DELEGATOR_1,
        }),
      );
      await db.insert(accountBalance).values(
        createAccountBalanceRow({
          accountId: DELEGATOR_1,
          delegate: VALID_ADDRESS,
        }),
      );

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegators?skip=0&limit=1`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(DELEGATOR_1),
            amount: "1000000000000000000",
            timestamp: "1700000000",
          },
        ],
        totalCount: 1,
      });
    });

    it("should use default skip=0 and limit=10 when not provided", async () => {
      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegators`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should return 400 for an invalid address", async () => {
      const res = await app.request("/accounts/not-a-valid-address/delegators");

      expect(res.status).toBe(400);
    });

    it("should return 400 for a limit exceeding 1000", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegators?limit=1001`,
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 for a negative skip value", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegators?skip=-1`,
      );

      expect(res.status).toBe(400);
    });
  });
});
