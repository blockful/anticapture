import { describe, it, expect } from "vitest";

import {
  DBTransaction,
  TransactionMapper,
  TransactionsRequest,
} from "@/mappers/";

import { TransactionsService } from "./index";

function createStubRepo(items: DBTransaction[] = [], count = 0) {
  return {
    getFilteredAggregateTransactions: async () => items,
    getAggregatedTransactionsCount: async () => count,
  };
}

const makeDBTransaction = (overrides = {}): DBTransaction => ({
  id: "test-id",
  transactionHash: "0xabc123",
  fromAddress: "0x1234567890123456789012345678901234567890",
  toAddress: "0x0987654321098765432109876543210987654321",
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: true,
  timestamp: 1700000000n,
  transfers: [],
  delegations: [],
  ...overrides,
});

const defaultRequest: TransactionsRequest = {
  limit: 10,
  skip: 0,
  orderDirection: "desc",
  affectedSupply: {},
  includes: { transfers: true, delegations: true },
};

describe("TransactionsService", () => {
  it("returns items mapped via TransactionMapper.toApi and totalCount from repo", async () => {
    const dbTx = makeDBTransaction();
    const service = new TransactionsService(createStubRepo([dbTx], 1));

    const result = await service.getTransactions(defaultRequest);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(TransactionMapper.toApi(dbTx));
    expect(result.totalCount).toBe(1);
  });

  it("returns empty items array when repository returns no transactions", async () => {
    const service = new TransactionsService(createStubRepo());

    const result = await service.getTransactions(defaultRequest);

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("totalCount comes from repository count, not items.length", async () => {
    const service = new TransactionsService(createStubRepo([], 42));

    const result = await service.getTransactions(defaultRequest);

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(42);
  });
});
