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
import { useState, useCallback } from "react";
import { VotingModal } from "@/features/governance/components/modals/VotingModal";
import { useVoterInfo } from "@/features/governance/hooks/useAccountPower";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfig from "@/shared/dao-config";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";

export const ProposalSection = () => {
  const { proposalId, daoId } = useParams<{
    proposalId: string;
    daoId: string;
  }>();
  const { address } = useAccount();
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [drawerAddress, setDrawerAddress] = useState<string | null>(null);
  const daoEnum = daoId.toUpperCase() as DaoIdEnum;
  const { decimals } = daoConfig[daoEnum];

  const handleAddressClick = useCallback((address: string) => {
    setDrawerAddress(address);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerAddress(null);
  }, []);

  const { proposal, loading, error } = useProposal({
    proposalId,
    daoId: daoEnum,
  });

  const { votingPower, votes } = useVoterInfo({
    address: address ?? "",
    daoId: daoEnum,
    proposalId,
    decimals,
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

  const supportValue = votes?.items[0]?.support;

  return (
    <div className="w-full pb-20 lg:pb-0">
      <ProposalHeader
        daoId={daoId as string}
        setIsVotingModalOpen={setIsVotingModalOpen}
        votingPower={votingPower}
        votes={votes}
        address={address}
        proposalStatus={proposal.status}
      />
      <div className="mx-auto w-full">
        <div className="bg-surface-background sticky top-[65px] z-10 hidden h-5 w-full lg:block" />

        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:pt-0">
          <div className="self-star left-0 top-5 flex h-fit w-full flex-col gap-4 lg:sticky lg:top-[85px] lg:w-[420px]">
            <TitleSection
              proposal={proposal}
              onAddressClick={handleAddressClick}
            />
            <ProposalInfoSection proposal={proposal} decimals={decimals} />
            <ProposalStatusSection proposal={proposal} />
          </div>

          <TabsSection
            proposal={proposal}
            onAddressClick={handleAddressClick}
          />
        </div>

        <VotingModal
          isOpen={isVotingModalOpen}
          onClose={() => setIsVotingModalOpen(false)}
          proposal={proposal as Query_Proposals_Items_Items}
          votingPower={votingPower}
          decimals={decimals}
        />

        <HoldersAndDelegatesDrawer
          isOpen={!!drawerAddress}
          onClose={handleCloseDrawer}
          entityType="delegate"
          address={drawerAddress || ""}
          daoId={daoEnum}
        />
      </div>

      {/* Fixed bottom bar for mobile voting */}
      <div className="bg-surface-background fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 p-4 lg:hidden dark:border-gray-800">
        {address ? (
          !supportValue ? (
            <Button
              className="flex w-full"
              onClick={() => setIsVotingModalOpen(true)}
            >
              Cast your vote
              <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <VotedBadge vote={Number(supportValue)} />
          )
        ) : (
          <ConnectWalletCustom className="w-full" />
        )}
      </div>
    </div>
  );
};

export const VotedBadge = ({ vote }: { vote: number }) => {
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-4">
        You voted
      </p>
      {getVoteText(vote)}
    </div>
  );
};
