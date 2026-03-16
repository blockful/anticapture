import type { Account, Chain, WalletClient } from "viem";
import { publicActions } from "viem";

import EnsGovernorAbi from "@/abis/ens-governor.json";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

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

const getDaoGovernanceAddress = (daoId: DaoIdEnum) => {
  return daoConfigByDaoId[daoId].daoOverview.contracts?.governor;
};

const getDaoVotingStrategyAddress = (daoId: DaoIdEnum) => {
  return daoConfigByDaoId[daoId].daoOverview.contracts?.votingStrategy;
};

export const voteOnProposal = async (
  vote: "for" | "against" | "abstain",
  proposalId: string,
  account: Account,
  chain: Chain,
  daoId: DaoIdEnum,
  walletClient: WalletClient,
  setTransactionhash: (hash: string) => void,
  comment?: string,
) => {
  const client = walletClient.extend(publicActions);
  const voteNumber = vote === "for" ? 1 : vote === "against" ? 0 : 2;

  try {
    let hash: `0x${string}`;

    const votingStrategyAddress = getDaoVotingStrategyAddress(daoId);

    if (votingStrategyAddress) {
      // Azorius/Fractal governance: vote on LinearVotingStrategy
      const { request } = await client.simulateContract({
        abi: LinearVotingStrategyAbi,
        address: votingStrategyAddress,
        functionName: "vote",
        args: [Number(proposalId), voteNumber],
        account,
      });
      hash = await client.writeContract(request);
    } else {
      // OZ Governor: castVote / castVoteWithReason on governor contract
      const daoGovernanceAddress = getDaoGovernanceAddress(daoId);
      if (!daoGovernanceAddress) {
        throw new Error("DAO governance address not found");
      }

      if (!comment) {
        const { request } = await client.simulateContract({
          abi: EnsGovernorAbi,
          address: daoGovernanceAddress,
          functionName: "castVote",
          args: [proposalId, voteNumber],
          account,
        });
        hash = await client.writeContract(request);
      } else {
        const { request } = await client.simulateContract({
          abi: EnsGovernorAbi,
          address: daoGovernanceAddress,
          functionName: "castVoteWithReason",
          args: [proposalId, voteNumber, comment],
          account,
        });
        hash = await client.writeContract(request);
      }
    }

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
