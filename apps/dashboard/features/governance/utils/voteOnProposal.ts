import { parseSignature, publicActions } from "viem";
import type {
  Account,
  Address,
  Chain,
  PublicActions,
  WalletActions,
  WalletClient,
} from "viem";

import { relayVote } from "@anticapture/client";
import type { RelayVotePathParamsDaoEnumKey } from "@anticapture/client";

import EnsGovernorAbi from "@/abis/ens-governor.json";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  isUserRejection,
  mapRelayerError,
} from "@/shared/utils/gaslessRelayerError";

const LinearVotingStrategyAbi = [
  {
    inputs: [
      { internalType: "uint32", name: "_proposalId", type: "uint32" },
      { internalType: "uint8", name: "_voteType", type: "uint8" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const GovernorNameAbi = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
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

type VoteClient = WalletClient & PublicActions & WalletActions;

type VoteParams = {
  proposalId: string;
  voteNumber: number;
  account: Account;
  comment?: string;
  delegatedVoteAddresses?: Address[];
};

type VoteHandler = (
  client: VoteClient,
  params: VoteParams,
) => Promise<`0x${string}`>;

/**
 * Azorius/Fractal: vote on LinearVotingStrategy. No reason support.
 */
const azoriusVoteHandler =
  (daoId: DaoIdEnum): VoteHandler =>
  async (client, params) => {
    const address =
      daoConfigByDaoId[daoId].daoOverview.contracts.votingStrategy;
    if (!address) throw new Error("Voting strategy address not found");

    const { request } = await client.simulateContract({
      abi: LinearVotingStrategyAbi,
      address,
      functionName: "vote",
      args: [Number(params.proposalId), params.voteNumber],
      account: params.account,
    });
    return client.writeContract(request);
  };

const TornGovernorVoteAbi = [
  {
    inputs: [
      { internalType: "address[]", name: "from", type: "address[]" },
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "bool", name: "support", type: "bool" },
    ],
    name: "castDelegatedVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * Tornado Cash (custom stake-to-vote governor): castDelegatedVote(address[],
 * uint256, bool) on the governor. Binary voting — for=true / against=false, no
 * abstain, no reason.
 */
const tornVoteHandler =
  (daoId: DaoIdEnum): VoteHandler =>
  async (client, params) => {
    const address = daoConfigByDaoId[daoId].daoOverview.contracts.governor;
    if (!address) throw new Error("DAO governance address not found");
    if (params.voteNumber === 2)
      throw new Error("Tornado Cash does not support abstain votes");
    const fromAddresses =
      params.delegatedVoteAddresses && params.delegatedVoteAddresses.length > 0
        ? params.delegatedVoteAddresses
        : [params.account.address];

    const { request } = await client.simulateContract({
      abi: TornGovernorVoteAbi,
      address,
      functionName: "castDelegatedVote",
      args: [fromAddresses, BigInt(params.proposalId), params.voteNumber === 1],
      account: params.account,
    });
    return client.writeContract(request);
  };

/**
 * OZ Governor: castVote / castVoteWithReason on governor contract.
 */
const ozGovernorVoteHandler =
  (daoId: DaoIdEnum): VoteHandler =>
  async (client, params) => {
    const address = daoConfigByDaoId[daoId].daoOverview.contracts.governor;
    if (!address) throw new Error("DAO governance address not found");

    if (!params.comment) {
      const { request } = await client.simulateContract({
        abi: EnsGovernorAbi,
        address,
        functionName: "castVote",
        args: [params.proposalId, params.voteNumber],
        account: params.account,
      });
      return client.writeContract(request);
    }

    const { request } = await client.simulateContract({
      abi: EnsGovernorAbi,
      address,
      functionName: "castVoteWithReason",
      args: [params.proposalId, params.voteNumber, params.comment],
      account: params.account,
    });
    return client.writeContract(request);
  };

const gaslessVoteHandler =
  (daoId: DaoIdEnum): VoteHandler =>
  async (client, params) => {
    const config = daoConfigByDaoId[daoId];
    const governor = config.daoOverview.contracts.governor;
    if (!governor) throw new Error("DAO governance address not found");

    const name = await client.readContract({
      abi: GovernorNameAbi,
      address: governor,
      functionName: "name",
    });

    const signature = await client.signTypedData({
      account: params.account,
      domain: {
        name,
        version: "1",
        chainId: config.daoOverview.chain.id,
        verifyingContract: governor,
      },
      types: BALLOT_TYPES,
      primaryType: "Ballot",
      message: {
        proposalId: BigInt(params.proposalId),
        support: params.voteNumber,
      },
    });

    const { r, s, v } = parseSignature(signature);
    if (v === undefined) throw new Error("Signature missing v");

    const response = await relayVote(
      daoId.toLowerCase() as RelayVotePathParamsDaoEnumKey,
      {
        proposalId: params.proposalId,
        support: params.voteNumber,
        r,
        s,
        v: Number(v),
      },
    );
    return response.transactionHash as `0x${string}`;
  };

function getVoteHandler(
  daoId: DaoIdEnum,
  useGasless: boolean,
  hasComment: boolean,
): VoteHandler {
  // Gasless relay uses castVoteBySig which doesn't support vote reasons.
  // Fall back to direct vote when a comment is present so it isn't silently dropped.
  if (useGasless && daoConfigByDaoId[daoId].gaslessRelayer && !hasComment) {
    return gaslessVoteHandler(daoId);
  }
  switch (daoId) {
    case DaoIdEnum.SHU:
      return azoriusVoteHandler(daoId);
    case DaoIdEnum.TORN:
      return tornVoteHandler(daoId);
    default:
      return ozGovernorVoteHandler(daoId);
  }
}

export const voteOnProposal = async (
  vote: "for" | "against" | "abstain",
  proposalId: string,
  account: Account,
  _chain: Chain,
  daoId: DaoIdEnum,
  walletClient: WalletClient,
  setTransactionhash: (hash: string) => void,
  comment?: string,
  minVotingPower: bigint | null = null,
  useGasless: boolean = false,
  delegatedVoteAddresses?: Address[],
) => {
  const client = walletClient.extend(publicActions);
  const voteNumber = vote === "for" ? 1 : vote === "against" ? 0 : 2;

  try {
    const trimmedComment = comment?.trim() || undefined;
    const handler = getVoteHandler(daoId, useGasless, !!trimmedComment);
    const hash = await handler(client as VoteClient, {
      proposalId,
      voteNumber,
      account,
      comment: trimmedComment,
      delegatedVoteAddresses,
    });

    setTransactionhash(hash);
    const transaction = await client.waitForTransactionReceipt({ hash });
    setTransactionhash("");

    return transaction;
  } catch (error) {
    console.error(error);
    if (isUserRejection(error)) return null;

    const config = daoConfigByDaoId[daoId];
    if (useGasless && config.gaslessRelayer) {
      const message = mapRelayerError(error, {
        operation: "vote",
        minVotingPower,
        decimals: config.decimals,
        symbol: config.name,
      });
      showCustomToast(message, "error");
    } else {
      showCustomToast("Failed to vote", "error");
    }
    return null;
  }
};
