import { parseSignature } from "viem";
import type { Account, Address, Hash, PublicClient, WalletClient } from "viem";

import { relayVote } from "@anticapture/client";
import type { RelayVotePathParamsDaoEnumKey } from "@anticapture/client";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  classifyRelayerFailure,
  isAlreadyVotedRejection,
} from "@/shared/utils/gaslessRelayerError";

const GovernorBallotAbi = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "hasVoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const BALLOT_TYPES = {
  Ballot: [
    { name: "proposalId", type: "uint256" },
    { name: "support", type: "uint8" },
  ],
} as const;

/**
 * Reads and the receipt wait go to a client for the DAO's own chain. The
 * wallet never sent the relayed transaction, and its provider may sit on
 * another chain or refuse the call, which used to surface as a failed vote
 * after the relayer had already broadcast it.
 */
export type VoteChainReader = Pick<
  PublicClient,
  "readContract" | "waitForTransactionReceipt"
>;

/** The only wallet capability the gasless path needs. */
export type BallotSigner = Pick<WalletClient, "signTypedData">;

/**
 * What the dashboard knows about a gasless vote once the call settles.
 *
 * - "success" / "reverted": the receipt was read on the DAO's chain.
 * - "unconfirmed": the relayer returned a hash but the receipt check failed
 *   or timed out. The vote is on its way, not failed.
 * - "already-voted": the governor already holds a vote from this address,
 *   seen before signing or reported by the relayer's simulation.
 * - "unknown": the relay request failed without a relayer rejection code
 *   (network error, gateway timeout, plain 5xx). The relayer may already have
 *   broadcast the vote, so this must not be shown as a failure or retried.
 */
export type GaslessVoteOutcome =
  | { status: "success" | "reverted" | "unconfirmed"; hash: Hash }
  | { status: "already-voted" | "unknown"; hash: null };

type RelayGaslessVoteParams = {
  daoId: DaoIdEnum;
  proposalId: string;
  support: number;
  account: Account;
  signer: BallotSigner;
  publicClient: VoteChainReader;
  onTxSubmitted: (hash: Hash) => void;
};

/**
 * A read that cannot run says nothing, so it lets the vote through: the
 * relayer simulates before sending and refuses a duplicate on its own, and
 * on the wallet fallback the governor refuses it just the same.
 */
export const hasVotedOnChain = async (
  publicClient: VoteChainReader,
  governor: Address,
  proposalId: string,
  voter: Address,
): Promise<boolean> => {
  try {
    return await publicClient.readContract({
      abi: GovernorBallotAbi,
      address: governor,
      functionName: "hasVoted",
      args: [BigInt(proposalId), voter],
    });
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Whether a relayed transaction is still waiting to be mined. Only a node
 * that knows the transaction and has no block for it says yes: a mined one
 * is answered by `hasVoted`, and one the node has never seen or has dropped
 * will not land. A read that fails says nothing, so it does not hold the
 * voter back from their wallet.
 */
export const isRelayedVotePending = async (
  publicClient: Pick<PublicClient, "getTransaction">,
  hash: Hash,
): Promise<boolean> => {
  try {
    const transaction = await publicClient.getTransaction({ hash });
    return transaction.blockNumber === null;
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Casts a vote through the relayer, which pays the gas, with exactly one
 * relay call per run.
 *
 * Rejects only when nothing was sent: the user declined the signature, or the
 * relayer refused before broadcasting. Anything after the relayer may have
 * broadcast is reported as an outcome instead, so the caller never shows a
 * landed vote as a failure and never offers the same ballot again.
 */
export const relayGaslessVote = async ({
  daoId,
  proposalId,
  support,
  account,
  signer,
  publicClient,
  onTxSubmitted,
}: RelayGaslessVoteParams): Promise<GaslessVoteOutcome> => {
  const { daoOverview } = daoConfigByDaoId[daoId];
  const governor = daoOverview.contracts.governor;
  if (!governor) throw new Error("DAO governance address not found");

  // A wallet signs the same ballot byte for byte, so a page that missed the
  // first vote would only replay it. Asking the chain first costs no signature.
  if (
    await hasVotedOnChain(publicClient, governor, proposalId, account.address)
  ) {
    return { status: "already-voted", hash: null };
  }

  const name = await publicClient.readContract({
    abi: GovernorBallotAbi,
    address: governor,
    functionName: "name",
  });

  const signature = await signer.signTypedData({
    account,
    domain: {
      name,
      version: "1",
      chainId: daoOverview.chain.id,
      verifyingContract: governor,
    },
    types: BALLOT_TYPES,
    primaryType: "Ballot",
    message: { proposalId: BigInt(proposalId), support },
  });

  const { r, s, v } = parseSignature(signature);
  if (v === undefined) throw new Error("Signature missing v");

  let hash: Hash;
  try {
    const response = await relayVote(
      daoId.toLowerCase() as RelayVotePathParamsDaoEnumKey,
      { proposalId, support, r, s, v: Number(v) },
    );
    hash = response.transactionHash as Hash;
  } catch (error) {
    if (isAlreadyVotedRejection(error)) {
      return { status: "already-voted", hash: null };
    }
    // A refusal before broadcasting is final and safe to retry, so it keeps
    // the caller's error path. Only an answer that says nothing about whether
    // the vote went out becomes "unknown".
    if (classifyRelayerFailure(error) !== "ambiguous") throw error;
    console.error(error);
    return { status: "unknown", hash: null };
  }

  onTxSubmitted(hash);

  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return {
      hash,
      status: receipt.status === "reverted" ? "reverted" : "success",
    };
  } catch (error) {
    console.error(error);
    return { hash, status: "unconfirmed" };
  }
};
