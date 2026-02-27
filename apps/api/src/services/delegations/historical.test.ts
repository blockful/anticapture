import { Address } from "viem";
import { describe, it, expect, beforeEach } from "vitest";

import { DBDelegation } from "@/mappers";

import { HistoricalDelegationsService } from "./historical";

const createMockDelegation = (
  overrides: Partial<DBDelegation> = {},
): DBDelegation => ({
  transactionHash: "0xabc123",
  daoId: "uni",
  delegateAccountId: "0x1234567890123456789012345678901234567890" as Address,
  delegatorAccountId: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
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

describe("HistoricalDelegationsService", () => {
  const address = "0x1234567890123456789012345678901234567890" as Address;

  let capturedArgs: unknown[];
  let stubResult: { items: DBDelegation[]; totalCount: number };
  let service: HistoricalDelegationsService;

  beforeEach(() => {
    capturedArgs = [];
    stubResult = { items: [], totalCount: 0 };

    const stubRepository = {
      getHistoricalDelegations: (...args: unknown[]) => {
        capturedArgs = args;
        return Promise.resolve(stubResult);
      },
    };
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    service = new HistoricalDelegationsService(stubRepository as any);
  });

  describe("getHistoricalDelegations", () => {
    it("should reorder parameters when forwarding to the repository", async () => {
      const delegateAddresses = [
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address,
      ];

      await service.getHistoricalDelegations(
        address,
        100n,
        200n,
        delegateAddresses,
        "asc",
        5,
        20,
      );

      expect(capturedArgs).toEqual([
        address,
        "asc",
        5,
        20,
        100n,
        200n,
        delegateAddresses,
      ]);
    });

    it("should map repository result to delegation items response", async () => {
      const delegation = createMockDelegation({
        transactionHash: "0xhistorical1",
        delegatorAccountId: address,
        delegateAccountId:
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address,
        delegatedValue: 9999n,
        timestamp: 1700050000n,
        logIndex: 7,
      });
      stubResult = { items: [delegation], totalCount: 1 };

      const result = await service.getHistoricalDelegations(
        address,
        undefined,
        undefined,
        undefined,
        "desc",
        0,
        10,
      );

      expect(result).toEqual({
        items: [
          {
            delegatorAddress: "0x1234567890123456789012345678901234567890",
            delegateAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            amount: "9999",
            timestamp: "1700050000",
            transactionHash: "0xhistorical1",
          },
        ],
        totalCount: 1,
      });
    });

    it("should return empty result when repository returns no data", async () => {
      const result = await service.getHistoricalDelegations(
        address,
        undefined,
        undefined,
        undefined,
        "desc",
        0,
        10,
      );

      expect(result).toEqual({ items: [], totalCount: 0 });
    });

    it("should pass undefined filters when not provided", async () => {
      await service.getHistoricalDelegations(
        address,
        undefined,
        undefined,
        undefined,
        "desc",
        0,
        10,
      );

      expect(capturedArgs).toEqual([
        address,
        "desc",
        0,
        10,
        undefined,
        undefined,
        undefined,
      ]);
    });

    it("should map multiple delegations from repository", async () => {
      const delegationA = createMockDelegation({
        transactionHash: "0xtxA",
        timestamp: 1700000000n,
        logIndex: 0,
      });
      const delegationB = createMockDelegation({
        transactionHash: "0xtxB",
        timestamp: 1700001000n,
        logIndex: 1,
      });
      const delegationC = createMockDelegation({
        transactionHash: "0xtxC",
        timestamp: 1700002000n,
        logIndex: 2,
      });
      stubResult = {
        items: [delegationA, delegationB, delegationC],
        totalCount: 3,
      };

      const result = await service.getHistoricalDelegations(
        address,
        undefined,
        undefined,
        undefined,
        "desc",
        0,
        10,
      );

      expect(result).toEqual({
        items: [
          {
            delegatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            delegateAddress: "0x1234567890123456789012345678901234567890",
            amount: "1000000000000000000",
            timestamp: "1700000000",
            transactionHash: "0xtxA",
          },
          {
            delegatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            delegateAddress: "0x1234567890123456789012345678901234567890",
            amount: "1000000000000000000",
            timestamp: "1700001000",
            transactionHash: "0xtxB",
          },
          {
            delegatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            delegateAddress: "0x1234567890123456789012345678901234567890",
            amount: "1000000000000000000",
            timestamp: "1700002000",
            transactionHash: "0xtxC",
          },
        ],
        totalCount: 3,
      });
    });

    it("should forward multiple delegate addresses to repository", async () => {
      const delegateAddresses = [
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address,
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address,
      ];

      await service.getHistoricalDelegations(
        address,
        undefined,
        undefined,
        delegateAddresses,
        "desc",
        0,
        10,
      );

      expect(capturedArgs).toEqual([
        address,
        "desc",
        0,
        10,
        undefined,
        undefined,
        delegateAddresses,
      ]);
    });
  });
});
