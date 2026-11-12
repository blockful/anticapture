import { describe, expect, it } from "vitest";
import type {
  Abi,
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
} from "viem";
import type {
  ReadContractParameters,
  ReadContractReturnType,
} from "viem/actions";

import { GTCClient, isGtcCharlieProposal } from "./index";

const BRAVO = "0x9D4C63565D5618310271bF3F3c01b2954C1D1639" as Address;
const CHARLIE = "0xef41CbD211076E8b1901e214Bf751d404cf06638" as Address;

class RecordingGtc extends GTCClient {
  readonly calls: { functionName: string; address: Address | undefined }[] = [];

  constructor() {
    super({} as never, CHARLIE, BRAVO);
  }

  protected override async getBlockNumber(): Promise<bigint> {
    return 100n;
  }

  protected override async readContract<
    const TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">,
    TArgs extends ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
  >(
    params: ReadContractParameters<TAbi, TFunctionName, TArgs>,
  ): Promise<ReadContractReturnType<TAbi, TFunctionName, TArgs>> {
    this.calls.push({
      functionName: String(params.functionName),
      address: params.address,
    });
    return 1n as ReadContractReturnType<TAbi, TFunctionName, TArgs>;
  }
}

describe("isGtcCharlieProposal", () => {
  it("keeps Bravo and Alpha integer ids off Charlie", () => {
    expect(isGtcCharlieProposal("66")).toBe(false);
    expect(isGtcCharlieProposal(null)).toBe(false);
    expect(isGtcCharlieProposal("not-a-number")).toBe(false);
  });

  it("recognises an OpenZeppelin hash id", () => {
    expect(isGtcCharlieProposal((1n << 128n).toString())).toBe(true);
  });
});

describe("GTCClient", () => {
  it("reads governance parameters from Charlie", async () => {
    const client = new RecordingGtc();

    await client.getVotingDelay();
    await client.getVotingPeriod();
    await client.getProposalThreshold();

    expect(client.calls.map((call) => call.address)).toEqual([
      CHARLIE,
      CHARLIE,
      CHARLIE,
    ]);
  });

  it("reads quorum from the governor that owns the proposal", async () => {
    const client = new RecordingGtc();

    await client.getQuorum("49");
    await client.getQuorum((1n << 128n).toString());

    expect(
      client.calls.map((call) => [call.functionName, call.address]),
    ).toEqual([
      ["quorum", BRAVO],
      ["quorum", CHARLIE],
    ]);
  });

  it("reads the current quorum from Charlie when no proposal is given", async () => {
    const client = new RecordingGtc();

    await client.getQuorum(null);

    expect(client.calls).toEqual([
      { functionName: "quorum", address: CHARLIE },
    ]);
  });
});
