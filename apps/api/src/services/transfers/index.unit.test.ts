import { describe, it, expect } from "vitest";
import { DBTransfer, TransferMapper, TransfersRequest } from "@/mappers/";
import { TransfersService } from "./index";
import { Address } from "viem";

function createStubRepo(items: DBTransfer[] = [], count = 0) {
  return {
    getTransfers: async () => items,
    getTransfersCount: async () => count,
  };
}

const makeDBTransfer = (overrides = {}): DBTransfer => ({
  id: "test-id",
  transactionHash: "0xdeadbeef",
  daoId: "UNI",
  tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  amount: 1000000000000000000n,
  fromAccountId: "0x1111111111111111111111111111111111111111" as Address,
  toAccountId: "0x2222222222222222222222222222222222222222" as Address,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: true,
  ...overrides,
});

const defaultRequest: TransfersRequest = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  limit: 10,
  skip: 0,
  orderBy: "timestamp",
  orderDirection: "asc",
};

describe("TransfersService", () => {
  it("returns items mapped via TransferMapper.toApi and totalCount from repo", async () => {
    const dbTransfer = makeDBTransfer();
    const service = new TransfersService(createStubRepo([dbTransfer], 1));

    const result = await service.getTransfers(defaultRequest);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(TransferMapper.toApi(dbTransfer));
    expect(result.totalCount).toBe(1);
  });

  it("returns empty items array when repository returns no transfers", async () => {
    const service = new TransfersService(createStubRepo());

    const result = await service.getTransfers(defaultRequest);

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("totalCount comes from repository count, not transfers.length", async () => {
    const service = new TransfersService(createStubRepo([], 99));

    const result = await service.getTransfers(defaultRequest);

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(99);
  });

  it("maps multiple transfers correctly", async () => {
    const dbTransfer1 = makeDBTransfer({
      transactionHash: "0xaaa",
      logIndex: 0,
    });
    const dbTransfer2 = makeDBTransfer({
      transactionHash: "0xbbb",
      logIndex: 1,
    });
    const service = new TransfersService(
      createStubRepo([dbTransfer1, dbTransfer2], 2),
    );

    const result = await service.getTransfers(defaultRequest);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual(TransferMapper.toApi(dbTransfer1));
    expect(result.items[1]).toEqual(TransferMapper.toApi(dbTransfer2));
  });
});
