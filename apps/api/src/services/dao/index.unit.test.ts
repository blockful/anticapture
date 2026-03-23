import { describe, it, expect, beforeEach } from "vitest";
import { DaoCache } from "@/cache/dao-cache";
import { DAOClient } from "@/clients";
import { DaoService } from "./index";

function createStubDAOClient(overrides?: Partial<DAOClient>): DAOClient {
  return {
    getDaoId: () => "UNI",
    getQuorum: () => Promise.resolve(40000000000000000000000000n),
    getProposalThreshold: () => Promise.resolve(2500000000000000000000000n),
    getVotingDelay: () => Promise.resolve(2n),
    getVotingPeriod: () => Promise.resolve(40320n),
    getTimelockDelay: () => Promise.resolve(172800n),
    getCurrentBlockNumber: () => Promise.resolve(0),
    getBlockTime: () => Promise.resolve(null),
    calculateQuorum: () => 0n,
    alreadySupportCalldataReview: () => false,
    getProposalStatus: () => Promise.resolve("ACTIVE"),
    ...overrides,
  };
}

describe("DaoService", () => {
  let service: DaoService;

  beforeEach(() => {
    service = new DaoService(createStubDAOClient(), new DaoCache(), 1);
  });

  it("returns correct governance parameters", async () => {
    const result = await service.getDaoParameters();

    expect(result).toEqual({
      id: "UNI",
      chainId: 1,
      quorum: "40000000000000000000000000",
      proposalThreshold: "2500000000000000000000000",
      votingDelay: "2",
      votingPeriod: "40320",
      timelockDelay: "172800",
      alreadySupportCalldataReview: false,
    });
  });

  it("propagates error when a client method rejects", async () => {
    const failingService = new DaoService(
      createStubDAOClient({
        getQuorum: () => Promise.reject(new Error("RPC timeout")),
      }),
      new DaoCache(),
      1,
    );

    await expect(failingService.getDaoParameters()).rejects.toThrow(
      "RPC timeout",
    );
  });
});
