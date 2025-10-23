"use client";

import { useParams } from "next/navigation";
import { useProposal } from "@/features/governance/hooks/useProposal";
import { ProposalStatusSection } from "@/features/governance/components/proposal-overview/ProposalStatusSection";
import { ProposalInfoSection } from "@/features/governance/components/proposal-overview/ProposalInfoSection";
import { TitleSection } from "@/features/governance/components/proposal-overview/TitleSection";
import { TabsSection } from "@/features/governance/components/proposal-overview/TabsSection";
import { ProposalHeader } from "@/features/governance/components/proposal-overview/ProposalHeader";
import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";
import { Button } from "@/shared/components";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import { ArrowRight } from "lucide-react";
import { useAccount } from "wagmi";
import { ProposalSectionSkeleton } from "@/features/governance/components/proposal-overview/ProposalSectionSkeleton";

export const ProposalSection = () => {
  const { proposalId, daoId } = useParams();
  const { address } = useAccount();

  const { proposal, loading, error } = useProposal({
    proposalId: proposalId as string,
  });

  if (loading) {
    return <ProposalSectionSkeleton />;
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
      <div className="flex flex-col gap-6 p-5 lg:flex-row">
        <div className="left-0 top-5 flex h-fit w-full flex-col gap-6 self-start lg:sticky lg:w-[420px]">
          <TitleSection proposal={proposal} />
          <ProposalInfoSection proposal={proposal} />
          <ProposalStatusSection proposal={proposal} />

          {address ? (
            <Button className="flex w-full lg:hidden" onClick={() => {}}>
              Cast your vote
              <ArrowRight className="size-[14px]" />
            </Button>
          ) : (
            <div className="flex w-full lg:hidden">
              <ConnectWalletCustom className="w-full" />
            </div>
          )}
        </div>

        <TabsSection proposal={proposal} />
      </div>
    </div>
  );
};
