"use client";

import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";

import { OffchainVotingModal } from "@/features/governance/components/modals/OffchainVotingModal";
import { VotingModal } from "@/features/governance/components/modals/VotingModal";
import {
  getVoteText,
  ProposalHeader,
} from "@/features/governance/components/proposal-overview/ProposalHeader";
import { ProposalInfoSection } from "@/features/governance/components/proposal-overview/ProposalInfoSection";
import { ProposalSectionSkeleton } from "@/features/governance/components/proposal-overview/ProposalSectionSkeleton";
import { ProposalStatusSection } from "@/features/governance/components/proposal-overview/ProposalStatusSection";
import { TabsSection } from "@/features/governance/components/proposal-overview/TabsSection";
import { TitleSection } from "@/features/governance/components/proposal-overview/TitleSection";
import { useVoterInfo } from "@/features/governance/hooks/useAccountPower";
import { useOffchainProposal } from "@/features/governance/hooks/useOffchainProposal";
import { useProposal } from "@/features/governance/hooks/useProposal";
import type {
  ProposalDetails,
  ProposalViewData,
} from "@/features/governance/types";
import {
  getOffchainProposalStatus,
  normalizeChoices,
  normalizeScores,
} from "@/features/governance/utils/offchainProposal";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import { Button } from "@/shared/components";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

interface ProposalSectionProps {
  isOffchain?: boolean;
}

export const ProposalSection = ({
  isOffchain = false,
}: ProposalSectionProps) => {
  const { proposalId: rawProposalId, daoId } = useParams<{
    proposalId: string;
    daoId: string;
  }>();

  const proposalId = rawProposalId as string;
  const offchainProposalId = isOffchain ? decodeURIComponent(proposalId) : "";

  const { address } = useAccount();
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [drawerAddress, setDrawerAddress] = useState<string | null>(null);
  const daoEnum = (daoId as string).toUpperCase() as DaoIdEnum;
  const { decimals } = daoConfig[daoEnum];

  const handleAddressClick = useCallback((addr: string) => {
    setDrawerAddress(addr);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerAddress(null);
  }, []);

  const {
    proposal: onchainProposal,
    loading: onchainLoading,
    error: onchainError,
  } = useProposal({
    proposalId: isOffchain ? "" : proposalId,
    daoId: daoEnum,
  });

  const {
    proposal: rawOffchainResponse,
    loading: offchainLoading,
    error: offchainError,
  } = useOffchainProposal({
    proposalId: offchainProposalId,
    daoId: daoEnum,
  });

  const rawOffchainProposal =
    rawOffchainResponse?.__typename === "OffchainProposal"
      ? rawOffchainResponse
      : null;

  const { votingPower, rawVotingPower, votes } = useVoterInfo({
    address: address ?? "",
    daoId: daoEnum,
    proposalId: isOffchain ? "" : proposalId,
    decimals,
  });

  const loading = isOffchain ? offchainLoading : onchainLoading;
  const error = isOffchain ? offchainError : onchainError;

  const offchainScores = useMemo(
    () => normalizeScores(rawOffchainProposal?.scores),
    [rawOffchainProposal?.scores],
  );
  const offchainChoices = useMemo(
    () => normalizeChoices(rawOffchainProposal?.choices),
    [rawOffchainProposal?.choices],
  );

  const adaptedOffchainProposal: ProposalViewData | null = rawOffchainProposal
    ? {
        id: rawOffchainProposal.id,
        daoId: daoId as string,
        txHash: null,
        proposerAccountId: rawOffchainProposal.author,
        title: rawOffchainProposal.title,
        description: rawOffchainProposal.body,
        quorum: "0",
        timestamp: rawOffchainProposal.created,
        status: getOffchainProposalStatus(
          rawOffchainProposal.state,
          rawOffchainProposal.type,
          offchainScores,
        ),
        forVotes: "0",
        againstVotes: "0",
        abstainVotes: "0",
        startTimestamp: rawOffchainProposal.start,
        endTimestamp: rawOffchainProposal.end,
        calldatas: null,
        targets: [],
        values: [],
      }
    : null;

  const proposal: ProposalViewData | null = isOffchain
    ? adaptedOffchainProposal
    : (onchainProposal ?? null);
  const snapshotLink = isOffchain
    ? (rawOffchainProposal?.link ?? null)
    : undefined;

  if (loading) {
    return <ProposalSectionSkeleton />;
  }

  if (error) {
    return <div className="text-primary p-4">Error: {error.message}</div>;
  }

  if (!proposal) {
    return <div className="text-primary p-4">Proposal not found</div>;
  }

  const supportValue =
    votes?.items[0]?.support != null
      ? Number(votes.items[0].support)
      : undefined;

  return (
    <div className="w-full pb-20 lg:pb-0">
      <ProposalHeader
        daoId={daoId as string}
        setIsVotingModalOpen={setIsVotingModalOpen}
        votingPower={votingPower}
        votes={votes}
        address={address}
        proposalStatus={proposal.status}
        snapshotLink={snapshotLink}
      />
      <div className="mx-auto w-full">
        <div className="bg-surface-background sticky top-[65px] z-10 hidden h-5 w-full lg:block" />

        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:pt-0">
          <div className="self-star left-0 top-5 flex h-fit w-full flex-col gap-4 lg:sticky lg:top-[85px] lg:w-[420px]">
            <TitleSection
              proposal={proposal}
              onAddressClick={handleAddressClick}
            />
            <ProposalInfoSection
              proposal={proposal}
              decimals={isOffchain ? 0 : decimals}
              offchainChoices={isOffchain ? offchainChoices : undefined}
              offchainScores={isOffchain ? offchainScores : undefined}
            />
            <ProposalStatusSection
              proposal={proposal}
              isOffchain={isOffchain}
            />
          </div>

          <TabsSection
            proposal={proposal}
            onAddressClick={handleAddressClick}
            isOffchain={isOffchain}
            offchainProposalId={offchainProposalId}
            offchainChoices={offchainChoices}
            offchainScores={isOffchain ? offchainScores : undefined}
            daoId={daoEnum}
          />
        </div>

        {!isOffchain && (
          <>
            <VotingModal
              isOpen={isVotingModalOpen}
              onClose={() => setIsVotingModalOpen(false)}
              proposal={onchainProposal as ProposalDetails}
              votingPower={votingPower}
              rawVotingPower={rawVotingPower}
              decimals={decimals}
              daoId={daoEnum}
            />

            <HoldersAndDelegatesDrawer
              isOpen={!!drawerAddress}
              onClose={handleCloseDrawer}
              entityType="delegate"
              address={drawerAddress || ""}
              daoId={daoEnum}
            />
          </>
        )}

        {isOffchain && rawOffchainProposal && (
          <OffchainVotingModal
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
            proposal={rawOffchainProposal}
          />
        )}
      </div>

      {/* Fixed bottom bar for mobile */}
      <div className="bg-surface-background fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 p-4 lg:hidden dark:border-gray-800">
        <MobileBottomBar
          isOffchain={isOffchain}
          address={address}
          supportValue={supportValue}
          proposalStatus={proposal.status}
          onVoteClick={() => setIsVotingModalOpen(true)}
        />
      </div>
    </div>
  );
};

const MobileBottomBar = ({
  isOffchain,
  address,
  supportValue,
  proposalStatus,
  onVoteClick,
}: {
  isOffchain: boolean;
  address: string | undefined;
  supportValue: number | undefined;
  proposalStatus: string;
  onVoteClick: () => void;
}) => {
  if (isOffchain) {
    const isOngoing = proposalStatus.toLowerCase() === "ongoing";
    if (address && isOngoing) {
      return (
        <Button className="flex w-full" onClick={onVoteClick}>
          Cast your vote
          <ArrowRight className="size-3.5" />
        </Button>
      );
    }
    return null;
  }

  if (address) {
    if (supportValue === undefined) {
      return (
        <Button className="flex w-full" onClick={onVoteClick}>
          Cast your vote
          <ArrowRight className="size-3.5" />
        </Button>
      );
    }
    return <MobileVotedBadge vote={Number(supportValue)} />;
  }

  return <ConnectWalletCustom className="w-full" />;
};

const MobileVotedBadge = ({ vote }: { vote: number }) => {
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-4">
        You voted
      </p>
      {getVoteText(vote)}
    </div>
  );
};
