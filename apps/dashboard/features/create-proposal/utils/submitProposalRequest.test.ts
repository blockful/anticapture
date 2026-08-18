import type { Address, Hex } from "viem";

import {
  getProposalCreatedEventAbi,
  isTornadoDao,
  submitProposalRequest,
} from "@/features/create-proposal/utils/submitProposalRequest";
import { DaoIdEnum } from "@/shared/types/daos";

const governorAddress: Address = "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce";
const proposalContract: Address = "0x1111111111111111111111111111111111111111";

type WriteContractFn = Parameters<typeof submitProposalRequest>[0];

const makeWriteContract = () => {
  const writeContract = jest.fn();
  return {
    writeContract: writeContract as unknown as WriteContractFn,
    mock: writeContract,
  };
};

const baseParams = {
  governorAddress,
  title: "Title",
  body: "Body",
  discussionUrl: "",
  chainId: 1,
};

describe("submitProposalRequest (Tornado Cash)", () => {
  it("classifies only TORN as a Tornado DAO", () => {
    expect(isTornadoDao(DaoIdEnum.TORN)).toBe(true);
    expect(isTornadoDao(DaoIdEnum.ENS)).toBe(false);
    expect(isTornadoDao(DaoIdEnum.SHU)).toBe(false);
  });

  it("proposes with the single action's address as the proposal contract", () => {
    const { writeContract, mock } = makeWriteContract();

    submitProposalRequest(writeContract, {
      ...baseParams,
      daoId: DaoIdEnum.TORN,
      encoded: {
        targets: [proposalContract],
        values: [0n],
        calldatas: ["0x" as Hex],
      },
    });

    expect(mock).toHaveBeenCalledTimes(1);
    const call = mock.mock.calls[0][0];
    expect(call.address).toBe(governorAddress);
    expect(call.functionName).toBe("propose");
    expect(call.args).toEqual([proposalContract, "# Title\n\nBody"]);
  });

  it("rejects proposals with more than one action", () => {
    const { writeContract, mock } = makeWriteContract();

    expect(() =>
      submitProposalRequest(writeContract, {
        ...baseParams,
        daoId: DaoIdEnum.TORN,
        encoded: {
          targets: [proposalContract, governorAddress],
          values: [0n, 0n],
          calldatas: ["0x" as Hex, "0x" as Hex],
        },
      }),
    ).toThrow(/exactly one action/);
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects proposals that send ETH", () => {
    const { writeContract, mock } = makeWriteContract();

    expect(() =>
      submitProposalRequest(writeContract, {
        ...baseParams,
        daoId: DaoIdEnum.TORN,
        encoded: {
          targets: [proposalContract],
          values: [1n],
          calldatas: ["0x" as Hex],
        },
      }),
    ).toThrow(/cannot send ETH/);
    expect(mock).not.toHaveBeenCalled();
  });

  it("keeps the OZ 4-arg propose for non-Tornado DAOs", () => {
    const { writeContract, mock } = makeWriteContract();

    submitProposalRequest(writeContract, {
      ...baseParams,
      daoId: DaoIdEnum.ENS,
      encoded: {
        targets: [proposalContract],
        values: [0n],
        calldatas: ["0x" as Hex],
      },
    });

    const call = mock.mock.calls[0][0];
    expect(call.functionName).toBe("propose");
    expect(call.args).toEqual([
      [proposalContract],
      [0n],
      ["0x"],
      "# Title\n\nBody",
    ]);
  });

  it("returns the Tornado ProposalCreated event ABI for TORN", () => {
    const abi = getProposalCreatedEventAbi(DaoIdEnum.TORN);
    const event = abi.find((entry) => entry.name === "ProposalCreated");
    const inputNames = event?.inputs.map((input) => input.name);
    // Same shape the indexer consumes: id and proposer indexed, then target,
    // startTime, endTime and description.
    expect(inputNames).toEqual([
      "proposalId",
      "proposer",
      "target",
      "startTime",
      "endTime",
      "description",
    ]);
    expect(event?.inputs[0].indexed).toBe(true);
    expect(event?.inputs[1].indexed).toBe(true);
  });
});
