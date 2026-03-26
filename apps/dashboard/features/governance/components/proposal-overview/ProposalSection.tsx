"use client";

import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";
import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import { useAccount } from "wagmi";

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
import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { ProposalStatus } from "@/features/governance/types";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import { Button } from "@/shared/components";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

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
  const daoOverview = daoConfig[daoEnum]?.daoOverview;
  const isOffchainOnly =
    !!daoOverview?.snapshot && !daoOverview?.contracts?.governor;

  const handleAddressClick = useCallback((address: string) => {
    setDrawerAddress(address);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerAddress(null);
  }, []);

  const onchainResult = useProposal({
    proposalId,
    daoId: daoEnum,
    skip: isOffchainOnly,
  });

  const offchainResult = useOffchainProposal({
    proposalId,
    daoId: daoEnum,
  });

  const { proposal, loading, error } = isOffchainOnly
    ? offchainResult
    : onchainResult;

  const { votingPower, rawVotingPower, votes } = useVoterInfo({
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

  // Offchain-only DAOs: render simplified view without onchain voting UI
  if (isOffchainOnly) {
    const offchainProposal = offchainResult.proposal!;
    return (
      <OffchainProposalDetail
        proposal={offchainProposal}
        daoId={daoId as string}
      />
    );
  }

  const onchainProposal = onchainResult.proposal!;
  const supportValue = votes?.items[0]?.support;

  return (
    <div className="w-full pb-20 lg:pb-0">
      <ProposalHeader
        daoId={daoId as string}
        setIsVotingModalOpen={setIsVotingModalOpen}
        votingPower={votingPower}
        votes={votes}
        address={address}
        proposalStatus={onchainProposal.status}
      />
      <div className="mx-auto w-full">
        <div className="bg-surface-background sticky top-[65px] z-10 hidden h-5 w-full lg:block" />

        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:pt-0">
          <div className="self-star left-0 top-5 flex h-fit w-full flex-col gap-4 lg:sticky lg:top-[85px] lg:w-[420px]">
            <TitleSection
              proposal={onchainProposal}
              onAddressClick={handleAddressClick}
            />
            <ProposalInfoSection
              proposal={onchainProposal}
              decimals={decimals}
            />
            <ProposalStatusSection proposal={onchainProposal} />
          </div>

          <TabsSection
            proposal={onchainProposal}
            onAddressClick={handleAddressClick}
          />
        </div>

        <VotingModal
          isOpen={isVotingModalOpen}
          onClose={() => setIsVotingModalOpen(false)}
          proposal={onchainProposal as Query_Proposals_Items_Items}
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
      </div>

      {/* Fixed bottom bar for mobile voting */}
      <div className="bg-surface-background fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 p-4 lg:hidden dark:border-gray-800">
        {address ? (
          supportValue === undefined ? (
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

const OffchainProposalDetail = ({
  proposal,
  daoId,
}: {
  proposal: GovernanceProposal;
  daoId: string;
}) => {
  const forNum = parseFloat(proposal.votes.for);
  const againstNum = parseFloat(proposal.votes.against);
  const total = forNum + againstNum;
  const forPct = total > 0 ? ((forNum / total) * 100).toFixed(1) : "0";
  const againstPct = total > 0 ? ((againstNum / total) * 100).toFixed(1) : "0";

  const statusColors: Record<string, string> = {
    [ProposalStatus.ONGOING]: "text-green-400",
    [ProposalStatus.EXECUTED]: "text-blue-400",
    [ProposalStatus.PENDING]: "text-yellow-400",
  };

  return (
    <div className="w-full">
      <ProposalHeader
        daoId={daoId}
        setIsVotingModalOpen={() => {}}
        votingPower="0"
        votes={null}
        address={undefined}
        proposalStatus={proposal.status}
      />
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-6 p-5 lg:flex-row">
          <div className="flex h-fit w-full flex-col gap-4 lg:w-[420px]">
            <div className="border-border-default flex flex-col gap-3 border p-3">
              <h1 className="text-primary text-[18px] font-semibold leading-tight">
                {proposal.title}
              </h1>
              <p className="text-secondary font-mono text-[12px] uppercase">
                <span className={statusColors[proposal.status] ?? ""}>
                  {proposal.status}
                </span>
                {" · "}
                {proposal.timeText}
              </p>
              <p className="text-secondary text-[12px]">
                Proposed by{" "}
                <span className="font-mono text-[11px]">
                  {proposal.proposer}
                </span>
              </p>
            </div>

            <div className="border-border-default flex flex-col gap-3 border p-3">
              <p className="text-secondary font-mono text-[14px] font-normal uppercase">
                Votes
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-green-400">For</span>
                  <span className="text-primary">
                    {Number(proposal.votes.for).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-secondary">({forPct}%)</span>
                  </span>
                </div>
                <div className="bg-surface-hover h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full bg-green-400"
                    style={{ width: `${forPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-red-400">Against</span>
                  <span className="text-primary">
                    {Number(proposal.votes.against).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-secondary">({againstPct}%)</span>
                  </span>
                </div>
                <div className="bg-surface-hover h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full bg-red-400"
                    style={{ width: `${againstPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
