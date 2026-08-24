import {
  decodeFunctionData,
  encodeFunctionData,
  type Abi,
  type Address,
  type Hex,
} from "viem";

import {
  BRAVO_MAX_OPERATIONS,
  TORN_EXECUTE_PROPOSAL_CALLDATA,
  findLiveBravoProposal,
  getProposalCreatedEventAbi,
  isAzoriusDao,
  isGovernorBravoDao,
  isTornadoDao,
  meetsProposalThreshold,
  submitProposalRequest,
  type EncodedActions,
} from "@/features/create-proposal/utils/submitProposalRequest";
import { DaoIdEnum } from "@/shared/types/daos";

const GOVERNOR = "0x408ED6354d4973f66138C91495F2f2FCbd8724C3" as Address;
const TARGET = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" as Address;

const encodedFor = (count: number): EncodedActions => ({
  targets: Array.from({ length: count }, () => TARGET),
  values: Array.from({ length: count }, (_, index) => BigInt(index)),
  calldatas: Array.from(
    { length: count },
    (_, index) => `0xdeadbeef0${index}` as Hex,
  ),
});

const submit = (daoId: DaoIdEnum, encoded: EncodedActions) => {
  const writeContract = jest.fn();

  submitProposalRequest(writeContract, {
    daoId,
    governorAddress: GOVERNOR,
    encoded,
    title: "Fund the thing",
    body: "## Synopsis\n\nDo it.",
    discussionUrl: "https://gov.uniswap.org/t/1",
    chainId: 1,
  });

  return writeContract;
};

describe("isGovernorBravoDao", () => {
  test.each([DaoIdEnum.UNISWAP, DaoIdEnum.NOUNS, DaoIdEnum.LIL_NOUNS])(
    "%s is on a Bravo governor",
    (daoId) => {
      expect(isGovernorBravoDao(daoId)).toBe(true);
    },
  );

  test.each([DaoIdEnum.ENS, DaoIdEnum.TORN])(
    "%s is not on a Bravo governor",
    (daoId) => {
      expect(isGovernorBravoDao(daoId)).toBe(false);
    },
  );

  test("no DAO is classified as both Bravo and Azorius", () => {
    const both = Object.values(DaoIdEnum).filter(
      (daoId) => isGovernorBravoDao(daoId) && isAzoriusDao(daoId),
    );
    expect(both).toEqual([]);
  });
});

describe("meetsProposalThreshold", () => {
  test("Bravo requires strictly more than the threshold", () => {
    expect(meetsProposalThreshold(DaoIdEnum.UNISWAP, 100n, 100n)).toBe(false);
    expect(meetsProposalThreshold(DaoIdEnum.UNISWAP, 101n, 100n)).toBe(true);
  });

  test("OZ Governor accepts voting power equal to the threshold", () => {
    expect(meetsProposalThreshold(DaoIdEnum.ENS, 100n, 100n)).toBe(true);
    expect(meetsProposalThreshold(DaoIdEnum.ENS, 99n, 100n)).toBe(false);
  });
});

describe("submitProposalRequest — GovernorBravo", () => {
  test("sends the 5-arg propose with one empty signature per action", () => {
    const encoded = encodedFor(2);
    const writeContract = submit(DaoIdEnum.UNISWAP, encoded);

    expect(writeContract).toHaveBeenCalledTimes(1);
    const call = writeContract.mock.calls[0][0];

    expect(call.address).toBe(GOVERNOR);
    expect(call.functionName).toBe("propose");
    expect(call.chainId).toBe(1);

    // Empty signatures keep the Timelock from prepending a second selector to
    // calldata that `encodeActions` already built in full.
    const [targets, values, signatures, calldatas, description] = call.args;
    expect(targets).toEqual(encoded.targets);
    expect(values).toEqual(encoded.values);
    expect(signatures).toEqual(["", ""]);
    expect(calldatas).toEqual(encoded.calldatas);
    expect(description).toBe(
      "# Fund the thing\n\nhttps://gov.uniswap.org/t/1\n\n## Synopsis\n\nDo it.",
    );
  });

  test("encodes against the real Bravo propose signature", () => {
    const encoded = encodedFor(1);
    const call = submit(DaoIdEnum.UNISWAP, encoded).mock.calls[0][0];

    // Round-trips only if the ABI matches
    // propose(address[],uint256[],string[],bytes[],string).
    const data = encodeFunctionData({
      abi: call.abi as Abi,
      functionName: "propose",
      args: call.args,
    });

    const decoded = decodeFunctionData({ abi: call.abi as Abi, data });
    expect(decoded.functionName).toBe("propose");
    expect(decoded.args?.[2]).toEqual([""]);
  });

  test("rejects a proposal above proposalMaxOperations before submitting", () => {
    const writeContract = jest.fn();

    expect(() =>
      submitProposalRequest(writeContract, {
        daoId: DaoIdEnum.UNISWAP,
        governorAddress: GOVERNOR,
        encoded: encodedFor(BRAVO_MAX_OPERATIONS + 1),
        title: "Too many",
        body: "body",
        chainId: 1,
      }),
    ).toThrow(/limited to 10 actions/);

    expect(writeContract).not.toHaveBeenCalled();
  });

  test("allows a proposal exactly at proposalMaxOperations", () => {
    const writeContract = submit(
      DaoIdEnum.UNISWAP,
      encodedFor(BRAVO_MAX_OPERATIONS),
    );
    expect(writeContract).toHaveBeenCalledTimes(1);
  });
});

describe("submitProposalRequest — OZ Governor", () => {
  test("keeps the 4-arg propose, with no signatures array", () => {
    const encoded = encodedFor(2);
    const call = submit(DaoIdEnum.ENS, encoded).mock.calls[0][0];

    expect(call.functionName).toBe("propose");
    expect(call.args).toHaveLength(4);
    expect(call.args[2]).toEqual(encoded.calldatas);
  });

  test("does not apply the Bravo action cap", () => {
    const writeContract = submit(
      DaoIdEnum.ENS,
      encodedFor(BRAVO_MAX_OPERATIONS + 1),
    );
    expect(writeContract).toHaveBeenCalledTimes(1);
  });
});

describe("findLiveBravoProposal", () => {
  const PROPOSER = "0x2222222222222222222222222222222222222222" as Address;

  const readContractFor = (latestId: bigint, state?: number) =>
    jest.fn(async ({ functionName }: { functionName: string }) => {
      if (functionName === "latestProposalIds") return latestId;
      if (functionName === "state") return state;
      throw new Error(`unexpected read: ${functionName}`);
    });

  const find = (readContract: ReturnType<typeof readContractFor>) =>
    findLiveBravoProposal(readContract, {
      governorAddress: GOVERNOR,
      proposer: PROPOSER,
    });

  test("returns null for a proposer with no prior proposal", async () => {
    const readContract = readContractFor(0n);
    await expect(find(readContract)).resolves.toBeNull();
    // No proposal id means no `state` lookup.
    expect(readContract).toHaveBeenCalledTimes(1);
  });

  test.each([
    [0, "Pending"],
    [1, "Active"],
  ])("returns the proposal id when its state is %i (%s)", async (state) => {
    await expect(find(readContractFor(42n, state))).resolves.toBe(42n);
  });

  test.each([
    [2, "Canceled"],
    [3, "Defeated"],
    [4, "Succeeded"],
    [5, "Queued"],
    [6, "Expired"],
    [7, "Executed"],
  ])("returns null when the latest proposal is %i (%s)", async (state) => {
    await expect(find(readContractFor(42n, state))).resolves.toBeNull();
  });
});

const tornGovernorAddress: Address =
  "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce";
const proposalContract: Address = "0x1111111111111111111111111111111111111111";
const executeProposalCalldata = TORN_EXECUTE_PROPOSAL_CALLDATA as Hex;

type WriteContractFn = Parameters<typeof submitProposalRequest>[0];

const makeWriteContract = () => {
  const mock = jest.fn();
  const writeContract: WriteContractFn = mock;
  return { writeContract, mock };
};

const baseParams = {
  governorAddress: tornGovernorAddress,
  title: "Title",
  body: "Body",
  discussionUrl: "",
  chainId: 1,
};

describe("submitProposalRequest (Tornado Cash)", () => {
  it("classifies only TORN as a Tornado DAO", () => {
    expect(isTornadoDao(DaoIdEnum.TORN)).toBe(true);
    expect(isTornadoDao(DaoIdEnum.ENS)).toBe(false);
    expect(isTornadoDao(DaoIdEnum.UNISWAP)).toBe(false);
  });

  it("proposes with the executeProposal() action's address as the proposal contract", () => {
    const { writeContract, mock } = makeWriteContract();

    submitProposalRequest(writeContract, {
      ...baseParams,
      daoId: DaoIdEnum.TORN,
      encoded: {
        targets: [proposalContract],
        values: [0n],
        calldatas: [executeProposalCalldata],
      },
    });

    expect(mock).toHaveBeenCalledTimes(1);
    const call = mock.mock.calls[0][0];
    expect(call.address).toBe(tornGovernorAddress);
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
          targets: [proposalContract, tornGovernorAddress],
          values: [0n, 0n],
          calldatas: [executeProposalCalldata, executeProposalCalldata],
        },
      }),
    ).toThrow(/exactly one custom action/);
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects actions that are not an executeProposal() call", () => {
    const { writeContract, mock } = makeWriteContract();

    // An erc20 transfer (or any other calldata) would create a proposal whose
    // delegatecalled execution does not match what the DAO reviewed.
    expect(() =>
      submitProposalRequest(writeContract, {
        ...baseParams,
        daoId: DaoIdEnum.TORN,
        encoded: {
          targets: [proposalContract],
          values: [0n],
          calldatas: ["0xa9059cbb" as Hex],
        },
      }),
    ).toThrow(/executeProposal/);
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
          calldatas: [executeProposalCalldata],
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
