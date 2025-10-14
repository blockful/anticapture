"use client";

import { useParams } from "next/navigation";
import { useProposal } from "@/features/governance/hooks/useProposal";
import { ProposalStatusSection } from "@/features/governance/components/proposal-overview/ProposalStatusSection";
import { ProposalInfoSection } from "@/features/governance/components/proposal-overview/ProposalInfoSection";
import { TitleSection } from "@/features/governance/components/proposal-overview/TitleSection";
import { TabsSection } from "@/features/governance/components/proposal-overview/TabsSection";
import { ProposalHeader } from "@/features/governance/components/proposal-overview/ProposalHeader";
import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";

export const ProposalSection = () => {
  const { proposalId, daoId } = useParams();

  const { proposal, loading, error } = useProposal({
    proposalId: proposalId as string,
  });

  // If loading, show loading skeleton - @todo: align with design
  if (loading) {
    return (
      <>
        <div className="text-primary p-4">Loading...</div>
      </>
    );
  }

  // If there is an error, show error message - @todo: align with design
  if (error) {
    return <div className="text-primary p-4">Error: {error.message}</div>;
  }

  // If proposal is not found, show 404 page - @todo: align with design
  if (!proposal) {
    return <div className="text-primary p-4">Proposal not found</div>;
  }

  return (
    <div>
      <ProposalHeader
        proposal={proposal as Query_Proposals_Items_Items}
        daoId={daoId as string}
      />
      <div className="flex gap-6 p-5">
        <div className="flex w-[420px] flex-col gap-6">
          <TitleSection proposal={proposal} />
          <ProposalInfoSection proposal={proposal} />
          <ProposalStatusSection proposal={proposal} />
        </div>

        <TabsSection proposal={proposal} />
      </div>
    </div>
  );
};
