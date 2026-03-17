import { publicActions } from "viem";
import type {
  Account,
  Chain,
  PublicActions,
  WalletActions,
  WalletClient,
} from "viem";

import EnsGovernorAbi from "@/abis/ens-governor.json";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

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

type VoteClient = WalletClient & PublicActions & WalletActions;

type VoteParams = {
  proposalId: string;
  voteNumber: number;
  account: Account;
  comment?: string;
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

/**
 * Returns the vote handler for a DAO. Add new cases for new governance frameworks.
 */
function getVoteHandler(daoId: DaoIdEnum): VoteHandler {
  switch (daoId) {
    case DaoIdEnum.SHU:
      return azoriusVoteHandler(daoId);
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
) => {
  const client = walletClient.extend(publicActions);
  const voteNumber = vote === "for" ? 1 : vote === "against" ? 0 : 2;

  try {
    const handler = getVoteHandler(daoId);
    const hash = await handler(client as VoteClient, {
      proposalId,
      voteNumber,
      account,
      comment,
    });

    setTransactionhash(hash);
    const transaction = await client.waitForTransactionReceipt({ hash });
    setTransactionhash("");

    return transaction;
  } catch (error) {
    console.error(error);
    showCustomToast("Failed to vote", "error");
    return null;
  }
};
