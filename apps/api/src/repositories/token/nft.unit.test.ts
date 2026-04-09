import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

import type { Drizzle } from "@/database";
import { tokenPrice } from "@/database/schema";
import * as schema from "@/database/schema";

import { NFTPriceRepository } from "./nft";

type TokenPriceInsert = typeof tokenPrice.$inferInsert;

let counter = 0;

const createTokenPrice = (
  overrides: Partial<TokenPriceInsert> = {},
): TokenPriceInsert => {
  const n = counter++;
  return {
    id: `price-${n}`,
    price: 1000000000000000000n,
    timestamp: BigInt(1700000000 + n),
    ...overrides,
  };
};

describe("NFTPriceRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: NFTPriceRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new NFTPriceRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(tokenPrice);
    counter = 0;
  });

  describe("getHistoricalNFTPrice", () => {
    it("should return prices ordered by timestamp descending", async () => {
      await db
        .insert(tokenPrice)
        .values([
          createTokenPrice({ timestamp: 1700000000n, price: 100n }),
          createTokenPrice({ timestamp: 1700001000n, price: 200n }),
          createTokenPrice({ timestamp: 1700002000n, price: 300n }),
        ]);

      const result = await repository.getHistoricalNFTPrice(10, 0);

      expect(result).toHaveLength(3);
      expect(Number(result[0]!.timestamp)).toBe(1700002000);
      expect(Number(result[1]!.timestamp)).toBe(1700001000);
      expect(Number(result[2]!.timestamp)).toBe(1700000000);
    });

    it("should apply limit", async () => {
      await db
        .insert(tokenPrice)
        .values([
          createTokenPrice({ timestamp: 1700000000n, price: 100n }),
          createTokenPrice({ timestamp: 1700001000n, price: 200n }),
          createTokenPrice({ timestamp: 1700002000n, price: 300n }),
        ]);

      const result = await repository.getHistoricalNFTPrice(2, 0);

      expect(result).toHaveLength(2);
    });

    it("should apply offset", async () => {
      await db
        .insert(tokenPrice)
        .values([
          createTokenPrice({ timestamp: 1700000000n, price: 100n }),
          createTokenPrice({ timestamp: 1700001000n, price: 200n }),
          createTokenPrice({ timestamp: 1700002000n, price: 300n }),
        ]);

      const result = await repository.getHistoricalNFTPrice(10, 1);

      expect(result).toHaveLength(2);
      expect(Number(result[0]!.timestamp)).toBe(1700001000);
    });

    it("should return rolling average price", async () => {
      await db
        .insert(tokenPrice)
        .values([
          createTokenPrice({ timestamp: 1700000000n, price: 100n }),
          createTokenPrice({ timestamp: 1700000100n, price: 300n }),
        ]);

      const result = await repository.getHistoricalNFTPrice(10, 0);

      expect(result).toHaveLength(2);
      expect(Number(result[0]!.price)).toBe(200);
    });

    it("should return empty array when no data exists", async () => {
      const result = await repository.getHistoricalNFTPrice(10, 0);

      expect(result).toEqual([]);
    });
  });

  describe("getTokenPrice", () => {
    it("should return the latest price", async () => {
      await db
        .insert(tokenPrice)
        .values([
          createTokenPrice({ timestamp: 1700000000n, price: 100n }),
          createTokenPrice({ timestamp: 1700002000n, price: 300n }),
          createTokenPrice({ timestamp: 1700001000n, price: 200n }),
        ]);

      const result = await repository.getTokenPrice();

      expect(result).toBe("300");
    });

    it("should return price as string", async () => {
      await db
        .insert(tokenPrice)
        .values(createTokenPrice({ timestamp: 1700000000n, price: 999n }));

      const result = await repository.getTokenPrice();

      expect(typeof result).toBe("string");
      expect(result).toBe("999");
    });
  });
});
