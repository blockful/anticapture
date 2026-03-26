import { useGetOffchainProposalByIdQuery } from "@anticapture/graphql-client/hooks";
import { useMemo } from "react";

import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { ProposalStatus, ProposalState } from "@/features/governance/types";
import { getTimeText } from "@/features/governance/utils";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

function offchainStateToStatus(state: string): ProposalStatus {
  switch (state.toLowerCase()) {
    case "active":
      return ProposalStatus.ONGOING;
    case "closed":
      return ProposalStatus.EXECUTED;
    default:
      return ProposalStatus.PENDING;
  }
}

function offchainStateToState(state: string): ProposalState {
  switch (state.toLowerCase()) {
    case "active":
      return ProposalState.ACTIVE;
    case "closed":
      return ProposalState.COMPLETED;
    default:
      return ProposalState.WAITING_TO_START;
  }
}

export const useOffchainProposal = ({
  proposalId,
  daoId,
}: {
  proposalId: string;
  daoId: DaoIdEnum;
}) => {
  const { data, loading, error } = useGetOffchainProposalByIdQuery({
    variables: { id: proposalId },
    skip: !proposalId,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  const proposal = useMemo((): GovernanceProposal | null => {
    const p = data?.offchainProposalById;
    if (!p) return null;

    const forVotes = p.scores?.forVotes ?? "0";
    const againstVotes = p.scores?.againstVotes ?? "0";
    const forNum = parseFloat(forVotes);
    const againstNum = parseFloat(againstVotes);
    const total = forNum + againstNum;
    const forPercentage = total > 0 ? ((forNum / total) * 100).toFixed(2) : "0";
    const againstPercentage =
      total > 0 ? ((againstNum / total) * 100).toFixed(2) : "0";

    return {
      id: p.id,
      daoId: p.spaceId,
      txHash: "",
      title: p.title || "Untitled Proposal",
      status: offchainStateToStatus(p.state),
      state: offchainStateToState(p.state),
      proposer: p.author,
      proposerAccountId: p.author,
      timestamp: String(p.created),
      startTimestamp: String(p.start),
      endTimestamp: String(p.end),
      votes: {
        for: forVotes,
        against: againstVotes,
        total: total.toString(),
        forPercentage,
        againstPercentage,
      },
      quorum: "0",
      timeText: getTimeText(String(p.start), String(p.end)),
      targets: [],
      values: [],
    };
  }, [data]);

  return { proposal, loading, error };
};
