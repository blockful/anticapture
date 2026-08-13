import {
  decodeFunctionData,
  encodeFunctionData,
  type Abi,
  type Address,
  type Hex,
} from "viem";

import {
  BRAVO_MAX_OPERATIONS,
  isAzoriusDao,
  isGovernorBravoDao,
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

  test.each([DaoIdEnum.ENS, DaoIdEnum.SHU])(
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
