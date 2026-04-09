import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { transfer } from "@/database/schema";
import { TransfersRequest } from "@/mappers";
import { TransfersRepository } from "./index";

const ADDR_A = getAddress("0x1111111111111111111111111111111111111111");
const ADDR_B = getAddress("0x2222222222222222222222222222222222222222");
const ADDR_C = getAddress("0x3333333333333333333333333333333333333333");

type TransferInsert = typeof transfer.$inferInsert;

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  id: "test-id",
  transactionHash: "0xabc",
  daoId: "UNI",
  tokenId: "uni",
  amount: 1000n,
  fromAccountId: ADDR_A,
  toAccountId: ADDR_B,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const defaultReq = (
  overrides: Partial<TransfersRequest> = {},
): TransfersRequest => ({
  address: ADDR_A,
  limit: 10,
  skip: 0,
  orderBy: "timestamp",
  orderDirection: "asc",
  ...overrides,
});

describe("TransfersRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: TransfersRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new TransfersRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(transfer);
  });

  describe("getTransfersCount", () => {
    it("returns 0 when no transfers exist", async () => {
      const result = await repository.getTransfersCount(defaultReq());
      expect(result).toBe(0);
    });

    it("returns count of transfers", async () => {
      await db.insert(transfer).values([
        // ADDR_A is sender
        createTransfer({
          transactionHash: "0xtx1",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
        }),
        // ADDR_A is receiver
        createTransfer({
          transactionHash: "0xtx2",
          fromAccountId: ADDR_B,
          toAccountId: ADDR_A,
        }),
        // ADDR_A not involved
        createTransfer({
          transactionHash: "0xtx3",
          fromAccountId: ADDR_B,
          toAccountId: ADDR_C,
        }),
      ]);

      const result = await repository.getTransfersCount(defaultReq());
      expect(result).toBe(2);
    });
  });

  describe("getTransfers", () => {
    it("returns empty array when no transfers exist", async () => {
      const result = await repository.getTransfers(defaultReq());
      expect(result).toHaveLength(0);
    });

    it("returns transfers where the address is the sender", async () => {
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: "0xtx1",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
        }),
        createTransfer({
          transactionHash: "0xtx2",
          fromAccountId: ADDR_B,
          toAccountId: ADDR_C,
        }),
      ]);

      const result = await repository.getTransfers(defaultReq());
      expect(result).toHaveLength(1);
      expect(result[0]?.transactionHash).toBe("0xtx1");
    });

    it("returns transfers where the address is the receiver", async () => {
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: "0xtx1",
          fromAccountId: ADDR_B,
          toAccountId: ADDR_A,
        }),
        createTransfer({
          transactionHash: "0xtx2",
          fromAccountId: ADDR_B,
          toAccountId: ADDR_C,
        }),
      ]);

      const result = await repository.getTransfers(defaultReq());
      expect(result).toHaveLength(1);
      expect(result[0]?.transactionHash).toBe("0xtx1");
    });

    it("filters by fromDate", async () => {
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: "0xtx1",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
          timestamp: 1699900000n,
        }),
        createTransfer({
          transactionHash: "0xtx2",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
          timestamp: 1700000000n,
        }),
        createTransfer({
          transactionHash: "0xtx3",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
          timestamp: 1700100000n,
        }),
      ]);

      const result = await repository.getTransfers(
        defaultReq({ fromDate: 1700000000 }),
      );

      expect(result).toHaveLength(2);
      const hashes = result.map((t) => t.transactionHash);
      expect(hashes).toContain("0xtx2");
      expect(hashes).toContain("0xtx3");
    });

    it("sorts by timestamp descending", async () => {
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: "0xtx1",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
          timestamp: 1699900000n,
        }),
        createTransfer({
          transactionHash: "0xtx2",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
          timestamp: 1700100000n,
        }),
        createTransfer({
          transactionHash: "0xtx3",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
          timestamp: 1700000000n,
        }),
      ]);

      const result = await repository.getTransfers(
        defaultReq({ orderDirection: "desc" }),
      );

      expect(result.map((t) => t.transactionHash)).toEqual([
        "0xtx2",
        "0xtx3",
        "0xtx1",
      ]);
    });

    it("returns 0 results when both from and to are specified but neither matches address", async () => {
      await db.insert(transfer).values(
        createTransfer({
          transactionHash: "0xtx1",
          fromAccountId: ADDR_B,
          toAccountId: ADDR_C,
        }),
      );

      // ADDR_A is the address, but from=ADDR_B and to=ADDR_C — address not involved
      const result = await repository.getTransfers(
        defaultReq({ address: ADDR_A, from: ADDR_B, to: ADDR_C }),
      );

      expect(result).toHaveLength(0);
    });

    it("returns transfers between specific from and to when address is involved", async () => {
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: "0xtx1",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_B,
        }),
        createTransfer({
          transactionHash: "0xtx2",
          fromAccountId: ADDR_A,
          toAccountId: ADDR_C,
        }),
      ]);

      // address=ADDR_A, from=ADDR_A, to=ADDR_B — only the first transfer matches
      const result = await repository.getTransfers(
        defaultReq({ address: ADDR_A, from: ADDR_A, to: ADDR_B }),
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.transactionHash).toBe("0xtx1");
    });
  });
});
