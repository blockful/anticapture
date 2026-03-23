import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { token as tokenTable } from "@/database/schema";
import { DaoIdEnum } from "@/lib/enums";
import { TokenRepository } from "@/repositories/token/erc20";
import { TokenService } from "@/services/token/token";
import { TokenPriceClient, token } from "./token-properties";

class FakeTokenPriceClient implements TokenPriceClient {
  private price = "0";

  setPrice(price: string) {
    this.price = price;
  }

  async getTokenPrice(): Promise<string> {
    return this.price;
  }
}

type TokenInsert = typeof tokenTable.$inferInsert;

// Use values within PostgreSQL bigint range (max: 9223372036854775807)
const createToken = (overrides: Partial<TokenInsert> = {}): TokenInsert => ({
  id: "ENS",
  name: DaoIdEnum.ENS,
  decimals: 18,
  totalSupply: 1000000000000000000n,
  delegatedSupply: 500000000000000000n,
  cexSupply: 10000000000000000n,
  dexSupply: 20000000000000000n,
  lendingSupply: 5000000000000000n,
  circulatingSupply: 800000000000000000n,
  treasury: 100000000000000000n,
  ...overrides,
});

let client: PGlite;
let db: Drizzle;
let fakeClient: FakeTokenPriceClient;
let app: Hono;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(schema, db as any);
  await apply();
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(tokenTable);
  fakeClient = new FakeTokenPriceClient();
  const repo = new TokenRepository(db);
  const service = new TokenService(repo);
  app = new Hono();
  token(app, fakeClient, service, DaoIdEnum.ENS);
});

describe("Token Properties Controller (integration)", () => {
  describe("GET /token", () => {
    it("should return 200 with token properties and default currency=usd", async () => {
      await db.insert(tokenTable).values(createToken());
      fakeClient.setPrice("25.50");

      const res = await app.request("/token");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        id: "ENS",
        name: DaoIdEnum.ENS,
        decimals: 18,
        totalSupply: "1000000000000000000",
        delegatedSupply: "500000000000000000",
        cexSupply: "10000000000000000",
        dexSupply: "20000000000000000",
        lendingSupply: "5000000000000000",
        circulatingSupply: "800000000000000000",
        nonCirculatingSupply: "0",
        treasury: "100000000000000000",
        price: "25.50",
      });
    });

    it("should accept currency=eth query parameter", async () => {
      await db.insert(tokenTable).values(createToken());
      fakeClient.setPrice("0.01");

      const res = await app.request("/token?currency=eth");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        id: "ENS",
        name: DaoIdEnum.ENS,
        decimals: 18,
        totalSupply: "1000000000000000000",
        delegatedSupply: "500000000000000000",
        cexSupply: "10000000000000000",
        dexSupply: "20000000000000000",
        lendingSupply: "5000000000000000",
        circulatingSupply: "800000000000000000",
        nonCirculatingSupply: "0",
        treasury: "100000000000000000",
        price: "0.01",
      });
    });

    it("should return 404 when token is null", async () => {
      const res = await app.request("/token");

      expect(res.status).toBe(404);
    });

    it("should serialize bigint fields as strings", async () => {
      await db
        .insert(tokenTable)
        .values(createToken({ totalSupply: 999999999999999999n }));
      fakeClient.setPrice("1");

      const res = await app.request("/token");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        id: "ENS",
        name: DaoIdEnum.ENS,
        decimals: 18,
        totalSupply: "999999999999999999",
        delegatedSupply: "500000000000000000",
        cexSupply: "10000000000000000",
        dexSupply: "20000000000000000",
        lendingSupply: "5000000000000000",
        circulatingSupply: "800000000000000000",
        nonCirculatingSupply: "0",
        treasury: "100000000000000000",
        price: "1",
      });
    });

    it("should return correct response shape", async () => {
      await db.insert(tokenTable).values(createToken());
      fakeClient.setPrice("25.50");

      const res = await app.request("/token");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        id: "ENS",
        name: DaoIdEnum.ENS,
        decimals: 18,
        totalSupply: "1000000000000000000",
        delegatedSupply: "500000000000000000",
        cexSupply: "10000000000000000",
        dexSupply: "20000000000000000",
        lendingSupply: "5000000000000000",
        circulatingSupply: "800000000000000000",
        nonCirculatingSupply: "0",
        treasury: "100000000000000000",
        price: "25.50",
      });
    });
  });
});
