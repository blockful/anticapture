"use client";

import { cn, formatNumberUserReadable } from "@/shared/utils";
import { GetProposalQuery } from "@anticapture/graphql-client";

import { TabsVotedContent } from "@/features/governance/components/proposal-overview/TabsVotedContent";
import { DaoIdEnum } from "@/shared/types/daos";
import { useParams } from "next/navigation";
import {
  useGetProposalNonVotersQuery,
  useGetVotesQuery,
} from "@anticapture/graphql-client/hooks";
import { formatUnits } from "viem";
import { TabsDidntVoteContent } from "@/features/governance/components/proposal-overview/TabsDidntVoteContent";
import daoConfig from "@/shared/dao-config";
import { parseAsStringEnum, useQueryState } from "nuqs";

type VoteTabId = "voted" | "didntVote";

interface VotesTabContentProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
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

  const TabsContent =
    activeTab === "voted"
      ? () => (
          <TabsVotedContent
            proposal={proposal}
            onAddressClick={onAddressClick}
          />
        )
      : () => (
          <TabsDidntVoteContent
            proposal={proposal}
            onAddressClick={onAddressClick}
          />
        );

  // Get votes for this proposal
  const { data } = useGetVotesQuery({
    variables: {
      proposalId: proposal.id,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoIdEnum,
      },
    },
  });

  // Get non-voters count for this proposal
  const { data: nonVotersData } = useGetProposalNonVotersQuery({
    variables: {
      id: proposal.id,
      limit: 1, // We only need the count
    },
    context: {
      headers: {
        "anticapture-dao-id": daoIdEnum,
      },
    },
  });

  const totalVotes = formatNumberUserReadable(
    Number(
      formatUnits(
        BigInt(proposal.forVotes) +
          BigInt(proposal.againstVotes) +
          BigInt(proposal.abstainVotes),
        decimals,
      ),
    ),
  );

  return (
    <div className="text-primary flex w-full flex-col gap-3 p-4">
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
            {data?.votes?.totalCount} voters / {totalVotes} VP
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
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <TabsContent />
      </div>
    </div>
  );
};
