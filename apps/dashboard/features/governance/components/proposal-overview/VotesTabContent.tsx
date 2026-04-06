"use client";

import {
  OrderDirection,
  QueryInput_TokenMetrics_MetricType,
} from "@anticapture/graphql-client";
import {
  useGetProposalNonVotersQuery,
  useGetVotesQuery,
  useTokenMetricsQuery,
} from "@anticapture/graphql-client/hooks";
import { useParams } from "next/navigation";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { formatUnits } from "viem";

import { TabsDidntVoteContent } from "@/features/governance/components/proposal-overview/TabsDidntVoteContent";
import { TabsVotedContent } from "@/features/governance/components/proposal-overview/TabsVotedContent";
import type { ProposalDetails } from "@/features/governance/types";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { getAuthHeaders } from "@/shared/utils/server-utils";

type VoteTabId = "voted" | "didntVote";

interface VotesTabContentProps {
  proposal: ProposalDetails;
  onAddressClick?: (address: string) => void;
}

export const VotesTabContent = ({
  proposal,
  onAddressClick,
}: VotesTabContentProps) => {
  const [activeTab, setActiveTab] = useQueryState(
    "voteTab",
    parseAsStringEnum<VoteTabId>(["voted", "didntVote"]).withDefault("voted"),
  );

  const { daoId } = useParams<{ daoId: string }>();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { decimals } = daoConfig[daoIdEnum];

  // Get delegated supply at proposal end time
  const { data: delegatedSupplyData } = useTokenMetricsQuery({
    variables: {
      metricType: QueryInput_TokenMetrics_MetricType.DelegatedSupply,
      startDate: null,
      endDate: Number(proposal.endTimestamp),
      orderDirection: OrderDirection.Desc,
      limit: 1,
      skip: null,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoIdEnum,
        ...getAuthHeaders(),
      },
    },
  });

  // Get votes for this proposal
  const { data } = useGetVotesQuery({
    variables: {
      proposalId: proposal.id,
      limit: null,
      skip: null,
      support: null,
      voterAddressIn: null,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoIdEnum,
        ...getAuthHeaders(),
      },
    },
  });

  // Get non-voters count for this proposal
  const { data: nonVotersData } = useGetProposalNonVotersQuery({
    variables: {
      id: proposal.id,
      limit: 1, // We only need the count
      skip: null,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoIdEnum,
        ...getAuthHeaders(),
      },
    },
  });

  const totalVotesBigInt =
    BigInt(proposal.forVotes) +
    BigInt(proposal.againstVotes) +
    BigInt(proposal.abstainVotes);

  const totalVotes = formatNumberUserReadable(
    Number(formatUnits(totalVotesBigInt, decimals)),
  );

  const historicalDelegatedSupply =
    delegatedSupplyData?.tokenMetrics?.items?.[0]?.high;
  const nonVoterVotingPower = historicalDelegatedSupply
    ? formatNumberUserReadable(
        Number(
          formatUnits(
            BigInt(historicalDelegatedSupply) - totalVotesBigInt,
            decimals,
          ),
        ),
      )
    : null;

  return (
    <div className="text-primary flex w-full flex-col gap-3 py-4 lg:p-4">
      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab("voted")}
          className={cn(
            "border-default text-secondary border-border-default font-roboto-mono flex w-full cursor-pointer items-center justify-between border p-4 px-3 py-2 text-[13px] font-medium uppercase not-italic leading-[20px] tracking-[0.78px]",
            activeTab === "voted" && "text-link border-link",
          )}
        >
          Voted
          <div className="text-secondary font-inter hidden text-[12px] font-normal not-italic leading-[16px] lg:block">
            {data?.votesByProposalId?.totalCount} voters / {totalVotes} VP
          </div>
        </div>
        <div
          onClick={() => setActiveTab("didntVote")}
          className={cn(
            "border-default text-secondary border-border-default font-roboto-mono flex w-full cursor-pointer items-center justify-between border p-4 px-3 py-2 text-[13px] font-medium uppercase not-italic leading-[20px] tracking-[0.78px]",
            activeTab === "didntVote" && "text-link border-link",
          )}
        >
          Didn&apos;t vote
          <div className="text-secondary font-inter hidden text-[12px] font-normal not-italic leading-[16px] lg:block">
            {nonVotersData?.proposalNonVoters?.totalCount || 0} voters
            {nonVoterVotingPower != null && ` / ${nonVoterVotingPower} VP`}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {activeTab === "voted" ? (
          <TabsVotedContent
            proposal={proposal}
            onAddressClick={onAddressClick}
          />
        ) : (
          <TabsDidntVoteContent
            proposal={proposal}
            onAddressClick={onAddressClick}
          />
        )}
      </div>
    </div>
  );
};
