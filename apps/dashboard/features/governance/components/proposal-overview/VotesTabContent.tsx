"use client";

import { cn } from "@/shared/utils";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { useState } from "react";

import { TabsVotedContent } from "@/features/governance/components/proposal-overview/TabsVotedContent";
import { DaoIdEnum } from "@/shared/types/daos";
import { useParams } from "next/navigation";
import { useGetVotesOnchainsTotalCountQuery } from "@anticapture/graphql-client/hooks";

export const VotesTabContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  const [activeTab, setActiveTab] = useState<"voted" | "didntVote">("voted");

  const { daoId } = useParams();

  const TabsContent = TabsContentMapping[activeTab];

  // Get votes for this proposal
  const { data } = useGetVotesOnchainsTotalCountQuery({
    variables: {
      proposalId: proposal.id,
    },
    context: {
      headers: {
        "anticapture-dao-id": (daoId as string)?.toUpperCase() as DaoIdEnum,
      },
    },
  });

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
          <div className="text-secondary font-inter text-[12px] font-medium not-italic leading-[16px]">
            {data?.votesOnchains?.totalCount} voters / 1.2M VP (76%)
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
          <div className="text-secondary font-inter text-[12px] font-medium not-italic leading-[16px]">
            32 voters / 1.2M VP (76%)
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <TabsContent proposal={proposal} />
      </div>
    </div>
  );
};

const TabsDidntVoteContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  console.log(proposal);
  return <div>Didn&apos;t vote</div>;
};

interface TabContentProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}

const TabsContentMapping = {
  voted: (props: TabContentProps) => (
    <TabsVotedContent proposal={props.proposal} />
  ),
  didntVote: (props: TabContentProps) => (
    <TabsDidntVoteContent proposal={props.proposal} />
  ),
};
