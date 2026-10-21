import type { Account, Address, Hash, Hex } from "viem";

import { relayVote } from "@anticapture/client";

import {
  relayGaslessVote,
  type BallotSigner,
  type VoteChainReader,
} from "@/features/governance/utils/relayGaslessVote";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

jest.mock("@anticapture/client", () => ({
  relayVote: jest.fn(),
}));

const mockedRelayVote = relayVote as jest.MockedFunction<typeof relayVote>;

const voter: Address = "0x76A6D08b82034b397E7e09dAe4377C18F132BbB8";
const account: Account = { address: voter, type: "json-rpc" };
const transactionHash: Hash = `0x${"ab".repeat(32)}`;
const proposalId =
  "51915723803355532053585313225201979004629663092454892570706465301184496475762";
// A real 65-byte signature shape: r, s, then v = 0x1c (28).
const signature: Hex = `0x${"d7".repeat(32)}${"67".repeat(32)}1c`;

const ensGovernor = daoConfigByDaoId[DaoIdEnum.ENS].daoOverview.contracts
  .governor as Address;

const relayerError = (status: number, code?: string, message?: string) =>
  Object.assign(new Error("Request failed"), {
    status,
    response: {
      status,
      statusText: "",
      headers: new Headers(),
      data: code ? { code, error: message ?? code } : { error: "boom" },
    },
  });

/**
 * The chain reader the flow is given: `hasVoted` and `name` answered by
 * function name, plus the receipt wait. Typed against the real interface so
 * a change to it surfaces here as a type error.
 */
const makeReader = ({
  hasVoted = false,
  hasVotedError,
  receipt = Promise.resolve({ status: "success" as const }),
}: {
  hasVoted?: boolean;
  hasVotedError?: Error;
  receipt?: Promise<{ status: "success" | "reverted" }>;
} = {}) => {
  const readContract = jest.fn(
    async ({ functionName }: { functionName: string }) => {
      if (functionName === "hasVoted") {
        if (hasVotedError) throw hasVotedError;
        return hasVoted;
      }
      if (functionName === "name") return "ENS Governor";
      throw new Error(`unexpected read ${functionName}`);
    },
  );
  const waitForTransactionReceipt = jest.fn(() => receipt);
  const reader = {
    readContract,
    waitForTransactionReceipt,
  } as unknown as VoteChainReader;
  return { reader, readContract, waitForTransactionReceipt };
};

const makeSigner = (sign: () => Promise<Hex> = async () => signature) => {
  const signTypedData = jest.fn(sign);
  const signer = { signTypedData } as unknown as BallotSigner;
  return { signer, signTypedData };
};

const run = (
  reader: VoteChainReader,
  signer: BallotSigner,
  onTxSubmitted: (hash: Hash) => void = () => {},
) =>
  relayGaslessVote({
    daoId: DaoIdEnum.ENS,
    proposalId,
    support: 1,
    account,
    signer,
    publicClient: reader,
    onTxSubmitted,
  });

describe("relayGaslessVote", () => {
  beforeEach(() => {
    mockedRelayVote.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("asks for no signature and makes no relay call when the vote is already on-chain", async () => {
    const { reader, readContract } = makeReader({ hasVoted: true });
    const { signer, signTypedData } = makeSigner();

    const outcome = await run(reader, signer);

    expect(outcome).toEqual({ status: "already-voted", hash: null });
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ensGovernor,
        functionName: "hasVoted",
        args: [BigInt(proposalId), voter],
      }),
    );
    expect(signTypedData).not.toHaveBeenCalled();
    expect(mockedRelayVote).not.toHaveBeenCalled();
  });

  it("signs the ballot, relays it exactly once and confirms on the DAO chain", async () => {
    const { reader, waitForTransactionReceipt } = makeReader();
    const { signer, signTypedData } = makeSigner();
    const onTxSubmitted = jest.fn();
    mockedRelayVote.mockResolvedValue({ transactionHash, voter });

    const outcome = await run(reader, signer, onTxSubmitted);

    expect(outcome).toEqual({ status: "success", hash: transactionHash });
    expect(signTypedData).toHaveBeenCalledWith(
      expect.objectContaining({
        account,
        domain: {
          name: "ENS Governor",
          version: "1",
          chainId: 1,
          verifyingContract: ensGovernor,
        },
        primaryType: "Ballot",
        message: { proposalId: BigInt(proposalId), support: 1 },
      }),
    );
    expect(mockedRelayVote).toHaveBeenCalledTimes(1);
    expect(mockedRelayVote).toHaveBeenCalledWith("ens", {
      proposalId,
      support: 1,
      r: `0x${"d7".repeat(32)}`,
      s: `0x${"67".repeat(32)}`,
      v: 28,
    });
    expect(onTxSubmitted).toHaveBeenCalledWith(transactionHash);
    expect(waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: transactionHash,
    });
  });

  // The production incident: the relay answered 200, then the receipt wait
  // failed and the screen offered the same vote again.
  it("reports a relayed vote whose receipt wait fails as unconfirmed, not as an error", async () => {
    const { reader } = makeReader({
      receipt: Promise.reject(new Error("wallet RPC refused the call")),
    });
    const { signer } = makeSigner();
    mockedRelayVote.mockResolvedValue({ transactionHash, voter });

    const outcome = await run(reader, signer);

    expect(outcome).toEqual({ status: "unconfirmed", hash: transactionHash });
    expect(mockedRelayVote).toHaveBeenCalledTimes(1);
  });

  it("reports a mined revert as reverted", async () => {
    const { reader } = makeReader({
      receipt: Promise.resolve({ status: "reverted" }),
    });
    const { signer } = makeSigner();
    mockedRelayVote.mockResolvedValue({ transactionHash, voter });

    await expect(run(reader, signer)).resolves.toEqual({
      status: "reverted",
      hash: transactionHash,
    });
  });

  it.each([
    ["a 5xx without a relayer code", relayerError(500)],
    ["a crash wearing the error contract", relayerError(500, "INTERNAL")],
    ["a transport failure", new TypeError("Failed to fetch")],
  ])(
    "reports %s as unknown, since the vote may already be on its way",
    async (_label, error) => {
      const { reader } = makeReader();
      const { signer } = makeSigner();
      mockedRelayVote.mockRejectedValue(error);

      await expect(run(reader, signer)).resolves.toEqual({
        status: "unknown",
        hash: null,
      });
    },
  );

  it("reads the governor's 'already cast' refusal as a vote that exists", async () => {
    const { reader } = makeReader();
    const { signer } = makeSigner();
    mockedRelayVote.mockRejectedValue(
      relayerError(
        409,
        "SIMULATION_FAILED",
        "Simulation of castVoteBySig() reverted: GovernorVotingSimple: vote already cast",
      ),
    );

    await expect(run(reader, signer)).resolves.toEqual({
      status: "already-voted",
      hash: null,
    });
  });

  it("rethrows a refusal made before anything was sent, so the voter can retry", async () => {
    const { reader } = makeReader();
    const { signer } = makeSigner();
    const refusal = relayerError(400, "INSUFFICIENT_VOTING_POWER");
    mockedRelayVote.mockRejectedValue(refusal);

    await expect(run(reader, signer)).rejects.toBe(refusal);
  });

  it("rethrows a signature the user rejected, without calling the relayer", async () => {
    const { reader } = makeReader();
    const rejection = new Error("User rejected the request.");
    const { signer } = makeSigner(() => Promise.reject(rejection));

    await expect(run(reader, signer)).rejects.toBe(rejection);
    expect(mockedRelayVote).not.toHaveBeenCalled();
  });

  it("still lets the voter sign when the on-chain hasVoted check cannot run", async () => {
    const { reader } = makeReader({ hasVotedError: new Error("rpc down") });
    const { signer, signTypedData } = makeSigner();
    mockedRelayVote.mockResolvedValue({ transactionHash, voter });

    await expect(run(reader, signer)).resolves.toEqual({
      status: "success",
      hash: transactionHash,
    });
    expect(signTypedData).toHaveBeenCalledTimes(1);
  });
});
