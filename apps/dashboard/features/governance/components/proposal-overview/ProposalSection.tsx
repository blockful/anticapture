"use client";

import { useParams } from "next/navigation";
import { useProposal } from "@/features/governance/hooks/useProposal";
import { ProposalStatusSection } from "@/features/governance/components/proposal-overview/ProposalStatusSection";
import { ProposalInfoSection } from "@/features/governance/components/proposal-overview/ProposalInfoSection";
import { TitleSection } from "@/features/governance/components/proposal-overview/TitleSection";
import { TabsSection } from "@/features/governance/components/proposal-overview/TabsSection";
import {
  getVoteText,
  ProposalHeader,
} from "@/features/governance/components/proposal-overview/ProposalHeader";
import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";
import { Button } from "@/shared/components";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import { ArrowRight } from "lucide-react";
import { useAccount } from "wagmi";
import { ProposalSectionSkeleton } from "@/features/governance/components/proposal-overview/ProposalSectionSkeleton";
import { useState } from "react";
import { VotingModal } from "@/features/governance/components/modals/VotingModal";
import { useVoterInfo } from "@/features/governance/hooks/useAccountPower";
import { DaoIdEnum } from "@/shared/types/daos";

export const ProposalSection = () => {
  const { proposalId, daoId } = useParams();
  const { address } = useAccount();
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);

  const { proposal, loading, error } = useProposal({
    proposalId: proposalId as string,
  });

  const { votingPower, votesOnchain } = useVoterInfo({
    address: address ?? "",
    daoId: daoId?.toString().toUpperCase() as DaoIdEnum,
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
        daoId={daoId as string}
        setIsVotingModalOpen={setIsVotingModalOpen}
        votingPower={votingPower}
        votesOnchain={votesOnchain}
        address={address}
      />
      <div className="bg-surface-background sticky top-[65px] z-10 hidden h-5 w-full lg:block" />

      <div className="flex flex-col gap-6 p-5 lg:flex-row lg:pt-0">
        <div className="self-star left-0 top-5 flex h-fit w-full flex-col gap-6 lg:sticky lg:top-[85px] lg:w-[420px]">
          <TitleSection proposal={proposal} />
          <ProposalInfoSection proposal={proposal} />
          <ProposalStatusSection proposal={proposal} />

          {address ? (
            !votesOnchain?.support ? (
              <Button
                className="flex w-full lg:hidden"
                onClick={() => setIsVotingModalOpen(true)}
              >
                Cast your vote
                <ArrowRight className="size-[14px]" />
              </Button>
            ) : (
              <VotedBadge vote={Number(votesOnchain?.support)} />
            )
          ) : (
            <div className="flex w-full lg:hidden">
              <ConnectWalletCustom className="w-full" />
            </div>
          )}
        </div>

        <TabsSection proposal={proposal} />
      </div>

      <VotingModal
        isOpen={isVotingModalOpen}
        onClose={() => setIsVotingModalOpen(false)}
        proposal={proposal as Query_Proposals_Items_Items}
      />
    </div>
  );
};

export const VotedBadge = ({ vote }: { vote: number }) => {
  return (
    <div className="flex w-full items-center justify-center gap-2 lg:hidden">
      <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
        You voted
      </p>
      {getVoteText(vote)}
    </div>
  );
};
