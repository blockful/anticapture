import { describe, it, expect, beforeEach } from "vitest";
import { getAddress } from "viem";

import { ChainStateService } from "./chain-state";
import { ProposalState } from "@/abi/governor";
import type { ChainReader } from "./chain-reader";

function createStubChainReader<T>() {
  let readContractResult: T = undefined as T;

  const stub: ChainReader & {
    setReadContractResult(value: T): void;
  } = {
    readContract: (async () =>
      readContractResult) as ChainReader["readContract"],
    getBalance: async () => 0n,
    setReadContractResult(value: T) {
      readContractResult = value;
    },
  };

  return stub;
}

const GOVERNOR = getAddress("0x1111111111111111111111111111111111111111");
const TOKEN = getAddress("0x2222222222222222222222222222222222222222");
const VOTER = getAddress("0x3333333333333333333333333333333333333333");

describe("ChainStateService", () => {
  let service: ChainStateService;
  let stubClient: ReturnType<typeof createStubChainReader>;

  beforeEach(() => {
    stubClient = createStubChainReader();
    service = new ChainStateService(stubClient, GOVERNOR, TOKEN);
  });

  it("returns voting power from token contract", async () => {
    stubClient.setReadContractResult(1000n);

    const power = await service.getVotingPower(VOTER);

    expect(power).toBe(1000n);
  });

  it("returns proposal state from governor", async () => {
    stubClient.setReadContractResult(ProposalState.Active);

    const state = await service.getProposalState(1n);

    expect(state).toBe(ProposalState.Active);
  });

  it("returns whether voter has already voted", async () => {
    stubClient.setReadContractResult(true);

    const voted = await service.hasVoted(1n, VOTER);

    expect(voted).toBe(true);
  });

  it("returns delegation nonce", async () => {
    stubClient.setReadContractResult(5n);

    const nonce = await service.getDelegationNonce(VOTER);

    expect(nonce).toBe(5n);
  });
});
