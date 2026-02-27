import { Address } from "viem";
import { describe, it, expect, beforeEach } from "vitest";

import { DBDelegation } from "@/mappers";

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
    getDelegations: (address: Address) => Promise<DBDelegation | undefined>;
  };
  let service: DelegationsService;

  beforeEach(() => {
    stubRepository = {
      getDelegations: () => Promise.resolve(undefined),
    };
    service = new DelegationsService(stubRepository);
  });

  describe("getDelegations", () => {
    it("should map repository result to delegation item response", async () => {
      const delegation = createMockDelegation({
        transactionHash: "0xdelegate1",
        delegatorAccountId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        delegatedValue: 5000n,
        timestamp: 1700001000n,
        logIndex: 3,
      });
      stubRepository.getDelegations = () => Promise.resolve(delegation);
      service = new DelegationsService(stubRepository);

      const result = await service.getDelegations(address);

      expect(result).toEqual({
        items: [
          {
            amount: "5000",
            timestamp: "1700001000",
            transactionHash: "0xdelegate1",
            delegatorAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            delegateAddress: "0x1234567890123456789012345678901234567890",
          },
        ],
        totalCount: 1,
      });
    });

    it("should return empty items and totalCount 0 when repository returns no data", async () => {
      const result = await service.getDelegations(address);

      expect(result).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should preserve delegate and delegator addresses in mapped response", async () => {
      const delegation = createMockDelegation({
        delegateAccountId: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        delegatorAccountId: "0x1111111111111111111111111111111111111111",
      });
      stubRepository.getDelegations = () => Promise.resolve(delegation);
      service = new DelegationsService(stubRepository);

      const result = await service.getDelegations(address);

      expect(result).toEqual({
        items: [
          {
            amount: "1000000000000000000",
            timestamp: "1700000000",
            transactionHash: "0xabc123",
            delegatorAddress: "0x1111111111111111111111111111111111111111",
            delegateAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
        ],
        totalCount: 1,
      });
    });
  });
});
