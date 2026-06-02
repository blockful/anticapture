"use client";

import type { VotesOffchainByProposalIdPathParamsDaoEnumKey } from "@anticapture/client";
import {
  offchainProposalByIdQueryKey,
  useVotesOffchainByProposalId,
  votesOffchainByProposalIdQueryKey,
} from "@anticapture/client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useCallback, useMemo, useRef } from "react";
import { useAccount } from "wagmi";

import { GovernanceActionModal } from "@/features/governance/components/modals/GovernanceActionModal";
import { OffchainVotingModal } from "@/features/governance/components/modals/OffchainVotingModal";
import { VotingModal } from "@/features/governance/components/modals/VotingModal";
import { OffchainVoteLabelChip } from "@/features/governance/components/proposal-overview/OffchainVoteLabelChip";
import {
  getVoteText,
  ProposalHeader,
} from "@/features/governance/components/proposal-overview/ProposalHeader";
import { ProposalInfoSection } from "@/features/governance/components/proposal-overview/ProposalInfoSection";
import { ProposalSectionSkeleton } from "@/features/governance/components/proposal-overview/ProposalSectionSkeleton";
import { ProposalStatusSection } from "@/features/governance/components/proposal-overview/ProposalStatusSection";
import { TabsSection } from "@/features/governance/components/proposal-overview/TabsSection";
import { TitleSection } from "@/features/governance/components/proposal-overview/TitleSection";
import { useAccountPower } from "@/features/governance/hooks/useAccountPower";
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
import { getOffchainVoteFullLabel } from "@/features/governance/utils/offchainVoteLabel";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import { ProposalHeaderProvider } from "@/features/governance/context/ProposalHeaderContext";
import { Button } from "@/shared/components";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

interface ProposalSectionProps {
  isOffchain?: boolean;
  isWhitelabel?: boolean;
}

export const ProposalSection = ({
  isOffchain = false,
  isWhitelabel = false,
}: ProposalSectionProps) => {
  const { proposalId: rawProposalId, daoId } = useParams<{
    proposalId: string;
    daoId: string;
  }>();

  const proposalId = rawProposalId as string;
  const offchainProposalId = isOffchain ? decodeURIComponent(proposalId) : "";

  const { address } = useAccount();
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [localOffchainVoteLabel, setLocalOffchainVoteLabel] = useState<
    string | null
  >(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [drawerAddress, setDrawerAddress] = useState<string | null>(null);
  const daoEnum = (daoId as string).toUpperCase() as DaoIdEnum;
  const { decimals } = daoConfig[daoEnum];

  // Clear optimistic vote state when the viewer or proposal changes to prevent
  // a previous session's label from bleeding into a new wallet or proposal.
  const prevVoteKeyRef = useRef(`${address ?? ""}:${offchainProposalId}`);
  if (prevVoteKeyRef.current !== `${address ?? ""}:${offchainProposalId}`) {
    prevVoteKeyRef.current = `${address ?? ""}:${offchainProposalId}`;
    if (localOffchainVoteLabel !== null) setLocalOffchainVoteLabel(null);
  }

  const handleAddressClick = useCallback((addr: string) => {
    setDrawerAddress(addr);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerAddress(null);
  }, []);

  const {
    data: onchainProposal,
    isLoading: onchainLoading,
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

  const rawOffchainProposal = rawOffchainResponse;
  const offchainDaoKey =
    daoEnum.toLowerCase() as VotesOffchainByProposalIdPathParamsDaoEnumKey;

  const { data: accountPower } = useAccountPower({
    address: address ?? "",
    daoId: daoEnum,
    proposalId: isOffchain ? "" : proposalId,
    decimals,
  });
  const { votingPower, rawVotingPower, votes } = accountPower;

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

  const { data: userOffchainVoteData } = useVotesOffchainByProposalId(
    offchainDaoKey,
    offchainProposalId,
    {
      voterAddresses: address ? [address] : undefined,
      limit: 1,
      orderBy: "timestamp",
      orderDirection: "desc",
    },
    {
      query: { enabled: !!isOffchain && !!offchainProposalId && !!address },
    },
  );

  const apiOffchainVoteChoice = (
    userOffchainVoteData?.items?.[0]?.choice ?? []
  ).filter((c): c is string => c != null);
  const apiOffchainVoteLabel =
    apiOffchainVoteChoice.length > 0
      ? getOffchainVoteFullLabel(apiOffchainVoteChoice, offchainChoices)
      : null;

  const offchainHasVoted = !!localOffchainVoteLabel || !!apiOffchainVoteLabel;
  const offchainVoteLabel = localOffchainVoteLabel ?? apiOffchainVoteLabel;

  const queryClient = useQueryClient();

  const handleOffchainVoteSuccess = useCallback(
    (voteLabel: string) => {
      setLocalOffchainVoteLabel(voteLabel);
      // Refetch votes (badge + table) and proposal scores so the UI reflects
      // the new vote without requiring a manual page reload.
      void queryClient.invalidateQueries({
        queryKey: votesOffchainByProposalIdQueryKey(
          offchainDaoKey,
          offchainProposalId,
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: offchainProposalByIdQueryKey(
          offchainDaoKey,
          offchainProposalId,
        ),
      });
    },
    [queryClient, offchainDaoKey, offchainProposalId],
  );

  const adaptedOffchainProposal: ProposalViewData | null = rawOffchainProposal
    ? {
        id: rawOffchainProposal.id,
        daoId: daoId as string,
        txHash: null,
        proposerAccountId: rawOffchainProposal.author as `0x${string}`,
        title: rawOffchainProposal.title,
        description: rawOffchainProposal.body ?? "",
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
        startBlock: 0,
        endBlock: 0,
        queuedTimestamp: null,
        executedTimestamp: null,
        queuedTxHash: null,
        executedTxHash: null,
        calldatas: [],
        targets: [],
        values: [],
        proposalType: null,
      }
    : null;

  const proposal: ProposalViewData | null = isOffchain
    ? adaptedOffchainProposal
    : onchainProposal;
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
    <ProposalHeaderProvider
      value={{
        votingPower,
        address,
        proposalStatus: proposal.status,
        supportValue,
        snapshotLink,
        setIsVotingModalOpen,
      }}
    >
      <div className="w-full pb-20 lg:pb-0">
        <ProposalHeader
          daoId={daoId as string}
          setIsVotingModalOpen={setIsVotingModalOpen}
          setIsQueueModalOpen={setIsQueueModalOpen}
          setIsExecuteModalOpen={setIsExecuteModalOpen}
          votingPower={votingPower}
          votes={votes}
          address={address}
          proposalStatus={proposal.status}
          snapshotLink={snapshotLink}
          isWhitelabel={isWhitelabel}
          offchainHasVoted={isOffchain ? offchainHasVoted : undefined}
          offchainVoteLabel={isOffchain ? offchainVoteLabel : undefined}
          offchainProposalType={
            isOffchain ? (rawOffchainProposal?.type ?? null) : undefined
          }
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
              isWhitelabel={isWhitelabel}
              offchainProposalId={offchainProposalId}
              offchainChoices={offchainChoices}
              offchainScores={isOffchain ? offchainScores : undefined}
              offchainProposalType={rawOffchainProposal?.type ?? null}
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

              <GovernanceActionModal
                isOpen={isQueueModalOpen}
                onClose={() => setIsQueueModalOpen(false)}
                action="queue"
                proposal={proposal}
                daoId={daoEnum}
              />

              <GovernanceActionModal
                isOpen={isExecuteModalOpen}
                onClose={() => setIsExecuteModalOpen(false)}
                action="execute"
                proposal={proposal}
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
              hasVoted={offchainHasVoted}
              onVoteSuccess={handleOffchainVoteSuccess}
            />
          )}
        </div>

        <MobileBottomBar
          isOffchain={isOffchain}
          address={address}
          supportValue={supportValue}
          proposalStatus={proposal.status}
          daoId={daoEnum}
          onVoteClick={() => setIsVotingModalOpen(true)}
          onQueueClick={() => setIsQueueModalOpen(true)}
          onExecuteClick={() => setIsExecuteModalOpen(true)}
          offchainHasVoted={offchainHasVoted}
          offchainVoteLabel={offchainVoteLabel}
          offchainProposalType={rawOffchainProposal?.type ?? null}
        />
      </div>
    </ProposalHeaderProvider>
  );
};

const MobileBottomBar = ({
  isOffchain,
  address,
  supportValue,
  proposalStatus,
  daoId,
  onVoteClick,
  onQueueClick,
  onExecuteClick,
  offchainHasVoted,
  offchainVoteLabel,
  offchainProposalType,
}: {
  isOffchain: boolean;
  address: string | undefined;
  supportValue: number | undefined;
  proposalStatus: string;
  daoId: DaoIdEnum;
  onVoteClick: () => void;
  onQueueClick: () => void;
  onExecuteClick: () => void;
  offchainHasVoted?: boolean;
  offchainVoteLabel?: string | null;
  offchainProposalType?: string | null;
}) => {
  const isOngoing = proposalStatus.toLowerCase() === "ongoing";

  let content: React.ReactNode = null;

  if (isOffchain) {
    if (address) {
      if (offchainHasVoted) {
        content = (
          <div className="flex w-full flex-col items-center gap-2">
            <MobileOffchainVotedBadge
              label={offchainVoteLabel ?? null}
              proposalType={offchainProposalType}
            />
            {isOngoing && (
              <Button className="flex w-full" onClick={onVoteClick}>
                Change your vote
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        );
      } else if (isOngoing) {
        content = (
          <Button className="flex w-full" onClick={onVoteClick}>
            Cast your vote
            <ArrowRight className="size-3.5" />
          </Button>
        );
      }
    }
  } else if (address) {
    if (
      proposalStatus === "succeeded" &&
      daoId.toUpperCase() !== DaoIdEnum.SHU
    ) {
      content = (
        <Button className="flex w-full" onClick={onQueueClick}>
          Queue Proposal
        </Button>
      );
    } else if (
      proposalStatus === "pending_execution" ||
      proposalStatus === "queued" ||
      (proposalStatus === "succeeded" && daoId.toUpperCase() === DaoIdEnum.SHU)
    ) {
      content = (
        <Button className="flex w-full" onClick={onExecuteClick}>
          Execute Proposal
        </Button>
      );
    } else if (supportValue === undefined) {
      content = (
        <Button className="flex w-full" onClick={onVoteClick}>
          Cast your vote
          <ArrowRight className="size-3.5" />
        </Button>
      );
    } else {
      content = <MobileVotedBadge vote={Number(supportValue)} />;
    }
  } else {
    content = <ConnectWalletCustom className="w-full" />;
  }

  if (!content) return null;

  return (
    <div className="bg-surface-background border-border-default fixed bottom-0 left-0 right-0 z-50 border-t p-4 lg:hidden">
      {content}
    </div>
  );
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

const MobileOffchainVotedBadge = ({
  label,
  proposalType,
}: {
  label: string | null;
  proposalType?: string | null;
}) => {
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <p className="text-secondary text-[12px] font-medium leading-4">
        You voted
      </p>
      {label && (
        <OffchainVoteLabelChip label={label} proposalType={proposalType} />
      )}
    </div>
  );
};
