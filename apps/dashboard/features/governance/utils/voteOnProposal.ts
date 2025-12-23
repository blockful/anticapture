import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { Account, Chain, publicActions, WalletClient } from "viem";
import EnsGovernorAbi from "@/abis/ens-governor.json";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";

const getDaoGovernanceAddress = (daoId: DaoIdEnum) => {
  return daoConfigByDaoId[daoId].daoOverview.contracts?.governor;
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
  const daoGovernanceAddress = getDaoGovernanceAddress(daoId);

  if (!daoGovernanceAddress) {
    throw new Error("DAO governance address not found");
  }

  const voteNumber = vote === "for" ? 1 : vote === "against" ? 0 : 2;

  const client = walletClient.extend(publicActions);

  try {
    let request;

    if (!comment) {
      const simulatedRequest = await client.simulateContract({
        abi: EnsGovernorAbi,
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        functionName: "castVote",
        args: [proposalId, voteNumber],
        account,
      });

      request = simulatedRequest.request;
    } else {
      const simulatedRequest = await client.simulateContract({
        abi: EnsGovernorAbi,
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        functionName: "castVoteWithReason",
        args: [proposalId, voteNumber, comment],
        account,
      });

      request = simulatedRequest.request;
    }

    if (!request) {
      throw new Error("Request not found");
    }

    const hash = await client.writeContract(request);
    setTransactionhash(hash);
    const transaction = await client.waitForTransactionReceipt({ hash: hash });
    setTransactionhash("");

    return transaction;
  } catch (error) {
    console.error(error);
    showCustomToast("Failed to vote", "error");
    return null;
  }
};
