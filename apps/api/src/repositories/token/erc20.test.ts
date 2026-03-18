import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

import { token } from "@/database/schema";
import * as schema from "@/database/schema";
import { DaoIdEnum } from "@/lib/enums";

import { TokenRepository } from "./erc20";

type TokenInsert = typeof token.$inferInsert;

const createToken = (overrides: Partial<TokenInsert> = {}): TokenInsert => ({
  id: "token-1",
  name: "UNI",
  decimals: 18,
  totalSupply: 1000000000000000000n,
  ...overrides,
});

describe("TokenRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: TokenRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new TokenRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(token);
  });

  describe("getTokenPropertiesByName", () => {
    it("should return token matching by name", async () => {
      await db
        .insert(token)
        .values(createToken({ id: "uni-token", name: "UNI" }));

      const result = await repository.getTokenPropertiesByName(DaoIdEnum.UNI);

      expect(result).toBeDefined();
      expect(result!.name).toBe("UNI");
      expect(result!.id).toBe("uni-token");
    });

    it("should return undefined when no token matches", async () => {
      await db.insert(token).values(createToken({ name: "UNI" }));

      const result = await repository.getTokenPropertiesByName(DaoIdEnum.AAVE);

      expect(result).toBeUndefined();
    });

    it("should return only the matching token when multiple exist", async () => {
      await db
        .insert(token)
        .values([
          createToken({ id: "uni-token", name: "UNI" }),
          createToken({ id: "aave-token", name: "AAVE", decimals: 18 }),
          createToken({ id: "ens-token", name: "ENS", decimals: 18 }),
        ]);

      const result = await repository.getTokenPropertiesByName(DaoIdEnum.AAVE);

      expect(result).toBeDefined();
      expect(result!.id).toBe("aave-token");
      expect(result!.name).toBe("AAVE");
    });

    it("should return undefined when table is empty", async () => {
      const result = await repository.getTokenPropertiesByName(DaoIdEnum.UNI);

      expect(result).toBeUndefined();
    });
  });
});
