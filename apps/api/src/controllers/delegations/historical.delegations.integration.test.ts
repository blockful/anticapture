import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address, getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { delegation } from "@/database/schema";
import { HistoricalDelegationsRepository } from "@/repositories/delegations/historical";
import { HistoricalDelegationsService } from "@/services/delegations";
import { historicalDelegations } from "./historical";

type DelegationInsert = typeof delegation.$inferInsert;

// VALID_ADDRESS is used as the delegatorAccountId (the address we query history for)
const VALID_ADDRESS = getAddress(
  "0x1234567890123456789012345678901234567890",
) as Address;
const DELEGATE_ADDRESS = getAddress(
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
) as Address;
const SECOND_DELEGATE = getAddress(
  "0x1111111111111111111111111111111111111111",
);
const DAO_ID = "uni";
const TX_HASH =
  "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
const TX_HASH_2 =
  "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbee2";

const createDelegationRow = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  delegatorAccountId: VALID_ADDRESS,
  delegateAccountId: DELEGATE_ADDRESS,
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

let client: PGlite;
let db: Drizzle;
let app: Hono;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(schema, db as any);
  await apply();

  const repo = new HistoricalDelegationsRepository(db);
  const service = new HistoricalDelegationsService(repo);
  app = new Hono();
  historicalDelegations(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(delegation);
});

describe("Historical Delegations Controller", () => {
  describe("GET /accounts/:address/delegations/historical", () => {
    it("should return 200 with correct response shape for a valid address", async () => {
      await db.insert(delegation).values(createDelegationRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(VALID_ADDRESS),
            delegateAddress: getAddress(DELEGATE_ADDRESS),
            amount: "1000000000000000000",
            timestamp: "1700000000",
            transactionHash: TX_HASH,
          },
        ],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items and totalCount 0 when no delegations exist", async () => {
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
      await db.insert(delegation).values([
        createDelegationRow({
          delegatorAccountId: VALID_ADDRESS,
          delegatedValue: 1000000000000000000n,
          timestamp: 1700000000n,
          transactionHash:
            "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd",
        }),
        createDelegationRow({
          delegatorAccountId: VALID_ADDRESS,
          delegatedValue: 2000000000000000000n,
          timestamp: 1700001000n,
          delegateAccountId: getAddress(
            "0x1111111111111111111111111111111111111111",
          ),
          transactionHash:
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(VALID_ADDRESS),
            delegateAddress: getAddress(
              "0x1111111111111111111111111111111111111111",
            ),
            amount: "2000000000000000000",
            timestamp: "1700001000",
            transactionHash:
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
          {
            delegatorAddress: getAddress(VALID_ADDRESS),
            delegateAddress: getAddress(DELEGATE_ADDRESS),
            amount: "1000000000000000000",
            timestamp: "1700000000",
            transactionHash:
              "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd",
          },
        ],
        totalCount: 2,
      });
    });

    it("should accept skip and limit query parameters", async () => {
      await db.insert(delegation).values(createDelegationRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?skip=0&limit=3`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(VALID_ADDRESS),
            delegateAddress: getAddress(DELEGATE_ADDRESS),
            amount: "1000000000000000000",
            timestamp: "1700000000",
            transactionHash: TX_HASH,
          },
        ],
        totalCount: 1,
      });
    });

    it("should use default skip=0 and limit=10 when not provided", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should return 400 for an invalid address", async () => {
      const res = await app.request(
        "/accounts/not-a-valid-address/delegations/historical",
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 for a limit exceeding 1000", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?limit=1001`,
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 for a negative skip value", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?skip=-1`,
      );

      expect(res.status).toBe(400);
    });

    it("should accept orderDirection query parameter", async () => {
      await db.insert(delegation).values([
        createDelegationRow({ timestamp: 1700000000n }),
        createDelegationRow({
          transactionHash: TX_HASH_2,
          timestamp: 1700001000n,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?orderDirection=asc`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(VALID_ADDRESS),
            delegateAddress: getAddress(DELEGATE_ADDRESS),
            amount: "1000000000000000000",
            timestamp: "1700000000",
            transactionHash: TX_HASH,
          },
          {
            delegatorAddress: getAddress(VALID_ADDRESS),
            delegateAddress: getAddress(DELEGATE_ADDRESS),
            amount: "1000000000000000000",
            timestamp: "1700001000",
            transactionHash: TX_HASH_2,
          },
        ],
        totalCount: 2,
      });
    });

    it("should return 400 for an invalid orderDirection value", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?orderDirection=invalid`,
      );

      expect(res.status).toBe(400);
    });

    it("should accept fromValue and toValue query parameters", async () => {
      // fromValue and toValue filter by timestamp, not delegatedValue
      // row 1: timestamp=1700000000 is within [1699000000, 1700500000]
      // row 2: timestamp=1701000000 is outside [1699000000, 1700500000]
      await db.insert(delegation).values([
        createDelegationRow({ timestamp: 1700000000n }),
        createDelegationRow({
          transactionHash: TX_HASH_2,
          timestamp: 1701000000n,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?fromValue=1699000000&toValue=1700500000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the row with timestamp=1700000000 is within the range
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(VALID_ADDRESS),
            delegateAddress: getAddress(DELEGATE_ADDRESS),
            amount: "1000000000000000000",
            timestamp: "1700000000",
            transactionHash: TX_HASH,
          },
        ],
        totalCount: 1,
      });
    });

    it("should accept a single delegateAddressIn query parameter", async () => {
      // Insert 2 rows with different delegates; filter by DELEGATE_ADDRESS
      await db.insert(delegation).values([
        createDelegationRow({ delegateAccountId: DELEGATE_ADDRESS }),
        createDelegationRow({
          transactionHash: TX_HASH_2,
          delegateAccountId: SECOND_DELEGATE,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?delegateAddressIn=${DELEGATE_ADDRESS}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the row with delegateAccountId=DELEGATE_ADDRESS is returned
      expect(body).toEqual({
        items: [
          {
            delegatorAddress: getAddress(VALID_ADDRESS),
            delegateAddress: getAddress(DELEGATE_ADDRESS),
            amount: "1000000000000000000",
            timestamp: "1700000000",
            transactionHash: TX_HASH,
          },
        ],
        totalCount: 1,
      });
    });

    it("should return 400 for an invalid delegateAddressIn address", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/delegations/historical?delegateAddressIn=not-an-address`,
      );

      expect(res.status).toBe(400);
    });
  });
});
