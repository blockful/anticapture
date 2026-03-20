import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getAddress, Address } from "viem";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { transfer } from "@/database/schema";
import { TransfersRepository } from "@/repositories/transfers";
import { TransfersService } from "@/services";
import { transfers } from "./index";

const VALID_ADDRESS: Address = getAddress(
  "0x1234567890123456789012345678901234567890",
);

type TransferInsert = typeof transfer.$inferInsert;

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: "0xabc",
  daoId: "UNI",
  tokenId: "uni",
  amount: 1000000000000000000n,
  fromAccountId: VALID_ADDRESS,
  toAccountId: getAddress("0x2222222222222222222222222222222222222222"),
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

describe("Transfers Controller", () => {
  let client: PGlite;
  let db: Drizzle;
  let app: Hono;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();

    const repo = new TransfersRepository(db);
    const service = new TransfersService(repo);
    app = new Hono();
    transfers(app, service);
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(transfer);
  });

  describe("GET /accounts/:address/transfers", () => {
    it("should return 200 with empty items when no transfers exist for the address", async () => {
      const res = await app.request(`/accounts/${VALID_ADDRESS}/transfers`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should return 200 with item when address matches fromAccountId", async () => {
      await db.insert(transfer).values(createTransfer());

      const res = await app.request(`/accounts/${VALID_ADDRESS}/transfers`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [
          {
            transactionHash: "0xabc",
            daoId: "UNI",
            tokenId: "uni",
            amount: "1000000000000000000",
            fromAccountId: VALID_ADDRESS,
            toAccountId: getAddress(
              "0x2222222222222222222222222222222222222222",
            ),
            timestamp: "1700000000",
            logIndex: 0,
            isCex: false,
            isDex: false,
            isLending: false,
            isTotal: false,
          },
        ],
      });
    });

    it("should return 400 for an invalid address path param", async () => {
      const res = await app.request("/accounts/invalid-address/transfers");

      expect(res.status).toBe(400);
    });
  });
});
