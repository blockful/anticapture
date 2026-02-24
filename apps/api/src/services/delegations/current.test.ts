import { Address } from "viem";
import { describe, it, expect, beforeEach } from "vitest";

import { DBDelegation, DelegationsRequestQuery } from "@/mappers";

import { DelegationsService } from "./current";

const createMockDelegation = (
  overrides: Partial<DBDelegation> = {},
): DBDelegation => ({
  transactionHash: "0xabc123",
  daoId: "uni",
  delegateAccountId: "0x1234567890123456789012345678901234567890",
  delegatorAccountId: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
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

describe("DelegationsService", () => {
  const address = "0x1234567890123456789012345678901234567890";

  let stubRepository: {
    getDelegations: (
      address: Address,
      sort: DelegationsRequestQuery,
    ) => Promise<DBDelegation[]>;
  };
  let service: DelegationsService;

  beforeEach(() => {
    stubRepository = {
      getDelegations: () => Promise.resolve([]),
    };
    service = new DelegationsService(stubRepository);
  });

  describe("getDelegations", () => {
    it("should return the repository result unchanged", async () => {
      const delegation = createMockDelegation({
        transactionHash: "0xdelegate1",
        delegatorAccountId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        delegatedValue: 5000n,
        timestamp: 1700001000n,
        logIndex: 3,
      });
      stubRepository.getDelegations = () => Promise.resolve([delegation]);
      service = new DelegationsService(stubRepository);

      const result = await service.getDelegations(address, {
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual([
        {
          transactionHash: "0xdelegate1",
          daoId: "uni",
          delegateAccountId: "0x1234567890123456789012345678901234567890",
          delegatorAccountId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          delegatedValue: 5000n,
          previousDelegate: null,
          timestamp: 1700001000n,
          logIndex: 3,
          isCex: false,
          isDex: false,
          isLending: false,
          isTotal: false,
        },
      ]);
    });

    it("should return empty array when repository returns no data", async () => {
      const result = await service.getDelegations(address, {
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual([]);
    });

    it("should return multiple delegations from repository", async () => {
      const delegationA = createMockDelegation({
        transactionHash: "0xtx1",
        delegatorAccountId: "0x1111111111111111111111111111111111111111",
        delegatedValue: 100n,
        timestamp: 1700001000n,
      });
      const delegationB = createMockDelegation({
        transactionHash: "0xtx2",
        delegatorAccountId: "0x2222222222222222222222222222222222222222",
        delegatedValue: 200n,
        timestamp: 1700002000n,
      });
      stubRepository.getDelegations = () =>
        Promise.resolve([delegationA, delegationB]);
      service = new DelegationsService(stubRepository);

      const result = await service.getDelegations(address, {
        orderBy: "amount",
        orderDirection: "asc",
      });

      expect(result).toEqual([delegationA, delegationB]);
    });
  });
});
