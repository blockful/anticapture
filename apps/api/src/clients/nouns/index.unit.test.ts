import { describe, expect, it } from "vitest";
import type { Abi, ContractFunctionArgs, ContractFunctionName } from "viem";
import type {
  ReadContractParameters,
  ReadContractReturnType,
} from "viem/actions";

import { ProposalStatus } from "@/lib/constants";

import { Client } from "./index";

class RecordingNouns extends Client {
  readonly calls: string[] = [];

  constructor() {
    super({} as never, "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d", "NOUNS");
  }

  protected override async readContract<
    const TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">,
    TArgs extends ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
  >(
    params: ReadContractParameters<TAbi, TFunctionName, TArgs>,
  ): Promise<ReadContractReturnType<TAbi, TFunctionName, TArgs>> {
    const functionName = String(params.functionName);
    this.calls.push(functionName);
    if (functionName !== "quorumVotes") {
      throw new Error(`unexpected ${functionName}`);
    }
    const proposalId =
      "args" in params && Array.isArray(params.args)
        ? params.args[0]
        : undefined;
    const quorum = proposalId === 269n ? 135n : 136n;
    return quorum as ReadContractReturnType<TAbi, TFunctionName, TArgs>;
  }
}

describe("Nouns quorum", () => {
  it("counts only for-votes toward quorum", () => {
    const client = new RecordingNouns();

    expect(
      client.calculateQuorum({
        forVotes: 101n,
        againstVotes: 78n,
        abstainVotes: 57n,
      }),
    ).toBe(101n);
  });

  it("reads quorumVotes for that proposal and marks Nouns 269 defeated", async () => {
    const client = new RecordingNouns();

    const status = await client.getProposalStatus(
      {
        id: "269",
        status: ProposalStatus.ACTIVE,
        startBlock: 1,
        endBlock: 10,
        forVotes: 101n,
        againstVotes: 78n,
        abstainVotes: 57n,
        endTimestamp: 0n,
      },
      100,
      1_700_000_000,
    );

    expect(client.calls).toEqual(["quorumVotes"]);
    expect(status).toBe(ProposalStatus.NO_QUORUM);
  });
});
