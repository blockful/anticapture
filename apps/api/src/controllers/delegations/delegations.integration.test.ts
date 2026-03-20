import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address, getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { accountBalance, delegation } from "@/database/schema";
import { DelegationsRepository } from "@/repositories/delegations/general";
import { DelegationsService } from "@/services/delegations/current";
import { delegations } from "./delegations";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;

const VALID_ADDRESS = getAddress(
  "0x1234567890123456789012345678901234567890",
) as Address;
const DELEGATE_ADDRESS = getAddress(
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
) as Address;
const DAO_ID = "uni";
const TX_HASH =
  "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";

const createAccountBalanceRow = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  accountId: VALID_ADDRESS,
  tokenId: "uni",
  balance: 1000000000000000000n,
  delegate: DELEGATE_ADDRESS,
  ...overrides,
});

const createDelegationRow = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  delegateAccountId: VALID_ADDRESS,
  delegatorAccountId: DELEGATE_ADDRESS,
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

const BASE_DELEGATION_ITEM = {
  delegatorAddress: getAddress(DELEGATE_ADDRESS),
  delegateAddress: VALID_ADDRESS,
  amount: "1000000000000000000",
  timestamp: "1700000000",
  transactionHash: TX_HASH,
};

const EMPTY_DELEGATIONS_RESPONSE = {
  items: [],
  totalCount: 0,
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

  const repo = new DelegationsRepository(db);
  const service = new DelegationsService(repo);
  app = new Hono();
  delegations(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(delegation);
  await db.delete(accountBalance);
});

describe("Delegations Controller", () => {
  describe("GET /accounts/:address/delegations", () => {
    it("should return 200 with correct response shape for a valid address", async () => {
      // DelegationsRepository.getDelegations:
      // 1. Queries accountBalance WHERE accountId = address -> gets `delegate` field
      // 2. Queries delegation WHERE delegatorAccountId = accountBalance.delegate
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db
        .insert(delegation)
        .values(createDelegationRow({ delegatorAccountId: DELEGATE_ADDRESS }));

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [BASE_DELEGATION_ITEM],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items and totalCount 0 when no delegations exist", async () => {
      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(EMPTY_DELEGATIONS_RESPONSE);
    });

    it("should return 200 with empty items when accountBalance has no matching delegation", async () => {
      // accountBalance exists but no matching delegation row for the delegate
      await db
        .insert(accountBalance)
        .values(createAccountBalanceRow({ delegate: DELEGATE_ADDRESS }));

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(EMPTY_DELEGATIONS_RESPONSE);
    });

    it("should return 400 for an invalid address", async () => {
      const res = await app.request(
        "/accounts/not-a-valid-address/delegations",
      );

      expect(res.status).toBe(400);
    });

    it("should checksum the address from the path parameter", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db
        .insert(delegation)
        .values(createDelegationRow({ delegatorAccountId: DELEGATE_ADDRESS }));
      const lowercaseAddress = VALID_ADDRESS.toLowerCase();

      const res = await app.request(
        `/accounts/${lowercaseAddress}/delegations`,
      );

      expect(res.status).toBe(200);
    });

    it("should serialize amount and timestamp as strings in response items", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db.insert(delegation).values(
        createDelegationRow({
          delegatorAccountId: DELEGATE_ADDRESS,
          delegatedValue: 999999999999999999n,
          timestamp: 1234567890n,
        }),
      );

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);
      const body = await res.json();

      expect(body).toEqual({
        items: [
          {
            ...BASE_DELEGATION_ITEM,
            amount: "999999999999999999",
            timestamp: "1234567890",
          },
        ],
        totalCount: 1,
      });
    });

    it("should include transactionHash in response items", async () => {
      const txHash =
        "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db.insert(delegation).values(
        createDelegationRow({
          delegatorAccountId: DELEGATE_ADDRESS,
          transactionHash: txHash,
        }),
      );

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);
      const body = await res.json();

      expect(body).toEqual({
        items: [{ ...BASE_DELEGATION_ITEM, transactionHash: txHash }],
        totalCount: 1,
      });
    });

    it("should use default orderBy=timestamp and orderDirection=desc when not provided", async () => {
      const TX_1 =
        "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbcc01";
      const TX_2 =
        "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbcc02";
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db.insert(delegation).values([
        createDelegationRow({
          delegatorAccountId: DELEGATE_ADDRESS,
          transactionHash: TX_1,
          timestamp: 1700000000n,
        }),
        createDelegationRow({
          delegatorAccountId: DELEGATE_ADDRESS,
          transactionHash: TX_2,
          logIndex: 1,
          timestamp: 1700001000n,
        }),
      ]);

      const res = await app.request(`/accounts/${VALID_ADDRESS}/delegations`);

      expect(res.status).toBe(200);
      const body = await res.json();
      // getDelegations uses findFirst with desc(timestamp), so returns the most recent one
      expect(body).toEqual({
        items: [
          {
            ...BASE_DELEGATION_ITEM,
            timestamp: "1700001000",
            transactionHash: TX_2,
          },
        ],
        totalCount: 1,
      });
    });
  });
});
