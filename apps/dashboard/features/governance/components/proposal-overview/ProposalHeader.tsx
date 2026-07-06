"use client";

import type { VotesByProposalIdQueryResponse } from "@anticapture/client";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Address } from "viem";

import { OffchainVoteLabelChip } from "@/features/governance/components/proposal-overview/OffchainVoteLabelChip";
import { BadgeStatus, Button } from "@/shared/components";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import { WhitelabelConnectWallet } from "@/shared/components/wallet/WhitelabelConnectWallet";
import daoConfigByDaoId from "@/shared/dao-config";
import { useGaslessEligibility } from "@/shared/hooks/useGaslessRelayer";
import { DaoIdEnum } from "@/shared/types/daos";
import { getDaoGovernanceListPath } from "@/shared/utils/whitelabel";

interface ProposalHeaderProps {
  daoId: string;
  setIsVotingModalOpen: (isOpen: boolean) => void;
  setIsQueueModalOpen: (isOpen: boolean) => void;
  setIsExecuteModalOpen: (isOpen: boolean) => void;
  votingPower: string;
  votes: VotesByProposalIdQueryResponse | null;
  address: string | undefined;
  proposalStatus: string;
  snapshotLink?: string | null;
  isWhitelabel?: boolean;
  offchainHasVoted?: boolean;
  offchainVoteLabel?: string | null;
  offchainProposalType?: string | null;
}

const ProposalHeaderAction = ({
  address,
  supportValue,
  proposalStatus,
  setIsVotingModalOpen,
  isWhitelabel,
  offchainHasVoted,
  offchainVoteLabel,
  offchainProposalType,
  daoId,
}: {
  address: string | undefined;
  supportValue: number | undefined;
  proposalStatus: string;
  setIsVotingModalOpen: (isOpen: boolean) => void;
  isWhitelabel: boolean;
  offchainHasVoted?: boolean;
  offchainVoteLabel?: string | null;
  offchainProposalType?: string | null;
  daoId: string;
}) => {
  const isOngoing = proposalStatus.toLowerCase() === "ongoing";
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { isEligible: isGaslessEligible } = useGaslessEligibility(
    daoIdEnum,
    address as Address | undefined,
    "vote",
  );

  if (address) {
    if (offchainHasVoted !== undefined) {
      if (offchainHasVoted) {
        return (
          <div className="hidden items-center gap-4 lg:flex">
            <div className="bg-secondary ml-4 h-7 w-px shrink-0" />
            <OffchainVotedBadge
              label={offchainVoteLabel ?? null}
              proposalType={offchainProposalType}
            />
            {isOngoing && (
              <Button
                className="hidden lg:flex"
                onClick={() => setIsVotingModalOpen(true)}
              >
                Change your vote
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        );
      }
      if (isOngoing) {
        return (
          <Button
            className="hidden lg:flex"
            onClick={() => setIsVotingModalOpen(true)}
          >
            Cast your vote
            <ArrowRight className="size-3.5" />
          </Button>
        );
      }
      return null;
    }

    if (supportValue === undefined) {
      if (isOngoing) {
        return (
          <Button
            className="hidden lg:flex"
            onClick={() => setIsVotingModalOpen(true)}
          >
            Cast your vote
            <ArrowRight className="size-3.5" />
            {isGaslessEligible && (
              <BadgeStatus
                variant="success"
                className="bg-success/80 text-inverted"
              >
                Free
              </BadgeStatus>
            )}
          </Button>
        );
      }
      return null;
    }

    const canChangeVote =
      daoConfigByDaoId[daoIdEnum]?.daoOverview.rules?.changeVote ?? false;

    return (
      <div className="hidden items-center gap-4 lg:flex">
        <div className="bg-secondary ml-4 h-7 w-px shrink-0" />
        <VotedBadge vote={Number(supportValue)} />
        {isOngoing && canChangeVote && (
          <Button
            className="hidden lg:flex"
            onClick={() => setIsVotingModalOpen(true)}
          >
            Change your vote
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="hidden lg:flex">
      {isWhitelabel ? (
        <WhitelabelConnectWallet />
      ) : (
        <ConnectWalletCustom label={isOngoing ? undefined : "Connect wallet"} />
      )}
    </div>
  );
};

const ProposalExecutionButtons = ({
  address,
  proposalStatus,
  daoId,
  setIsQueueModalOpen,
  setIsExecuteModalOpen,
}: {
  address: string | undefined;
  proposalStatus: string;
  daoId: string;
  setIsQueueModalOpen: (isOpen: boolean) => void;
  setIsExecuteModalOpen: (isOpen: boolean) => void;
}) => {
  if (!address) return null;

  const isShu = daoId.toUpperCase() === DaoIdEnum.SHU;

  return (
    <>
      {proposalStatus === "succeeded" && !isShu && (
        <Button
          className="hidden lg:flex"
          onClick={() => setIsQueueModalOpen(true)}
        >
          Queue Proposal
        </Button>
      )}
      {(proposalStatus === "pending_execution" ||
        // Azorius (SHU) proposals are QUEUED while timelocked and
        // executeProposal reverts until PENDING_EXECUTION
        (proposalStatus === "queued" && !isShu)) && (
        <Button
          className="hidden lg:flex"
          onClick={() => setIsExecuteModalOpen(true)}
        >
          Execute Proposal
        </Button>
      )}
    </>
  );
};

export const ProposalHeader = ({
  daoId,
  votingPower,
  votes,
  setIsVotingModalOpen,
  setIsQueueModalOpen,
  setIsExecuteModalOpen,
  address,
  proposalStatus,
  snapshotLink,
  isWhitelabel = false,
  offchainHasVoted,
  offchainVoteLabel,
  offchainProposalType,
}: ProposalHeaderProps) => {
  const pathname = usePathname();
  const supportValue =
    votes?.items[0]?.support != null
      ? Number(votes.items[0].support)
      : undefined;
  const proposalListHref = getDaoGovernanceListPath({
    daoId: daoId.toUpperCase() as DaoIdEnum,
    pathname,
    isOffchain: snapshotLink !== undefined,
  });

  return (
    <div className="text-primary bg-surface-background border-border-default sticky z-20 flex h-[65px] w-full shrink-0 items-center justify-between gap-6 border-b px-5 py-2 lg:top-0">
      <div className="mx-auto flex w-full flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          {isWhitelabel ? (
            <nav className="text-body-md flex items-center gap-1.5">
              <Link
                href={proposalListHref}
                className="text-link font-medium hover:underline"
              >
                Proposals
              </Link>
              <span className="text-dimmed">/</span>
              <span className="text-secondary">
                {snapshotLink !== undefined
                  ? "Offchain proposal"
                  : "Proposal details"}
              </span>
            </nav>
          ) : (
            <Link
              href={proposalListHref}
              className="text-secondary hover:text-primary inline-flex items-center gap-2 text-[14px] font-normal leading-[20px] transition-colors"
            >
              <span>Proposals</span>
              <ChevronRight className="size-4" />
            </Link>
          )}
          {!isWhitelabel && (
            <p className="text-primary text-[14px] font-medium leading-[20px]">
              {snapshotLink !== undefined
                ? "Offchain proposal"
                : "Proposal details"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isWhitelabel ? (
            <>
              {address && (
                <div className="hidden lg:flex">
                  <WhitelabelConnectWallet />
                </div>
              )}
              <ProposalHeaderAction
                address={address}
                supportValue={
                  snapshotLink ? undefined : (supportValue ?? undefined)
                }
                proposalStatus={proposalStatus}
                setIsVotingModalOpen={setIsVotingModalOpen}
                isWhitelabel={isWhitelabel}
                offchainHasVoted={
                  snapshotLink !== undefined ? offchainHasVoted : undefined
                }
                offchainVoteLabel={
                  snapshotLink !== undefined ? offchainVoteLabel : undefined
                }
                offchainProposalType={
                  snapshotLink !== undefined ? offchainProposalType : undefined
                }
                daoId={daoId}
              />
              {snapshotLink === undefined && (
                <ProposalExecutionButtons
                  address={address}
                  proposalStatus={proposalStatus}
                  daoId={daoId}
                  setIsQueueModalOpen={setIsQueueModalOpen}
                  setIsExecuteModalOpen={setIsExecuteModalOpen}
                />
              )}
            </>
          ) : snapshotLink !== undefined ? (
            <>
              {address && (
                <div className="hidden flex-col items-end lg:flex">
                  <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
                    Your voting power
                  </p>
                  <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                    {votingPower}
                  </p>
                </div>
              )}
              <ProposalHeaderAction
                address={address}
                supportValue={undefined}
                proposalStatus={proposalStatus}
                setIsVotingModalOpen={setIsVotingModalOpen}
                isWhitelabel={isWhitelabel}
                offchainHasVoted={offchainHasVoted}
                offchainVoteLabel={offchainVoteLabel}
                offchainProposalType={offchainProposalType}
                daoId={daoId}
              />
            </>
          ) : (
            <>
              <p className="text-secondary flex items-center gap-2 whitespace-nowrap text-[14px] font-normal leading-[20px] lg:hidden">
                Your VP: <span className="text-primary">{votingPower}</span>
              </p>

              {address && (
                <div className="hidden flex-col items-end lg:flex">
                  <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
                    Your voting power
                  </p>
                  <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                    {votingPower}
                  </p>
                </div>
              )}

              <ProposalHeaderAction
                address={address}
                supportValue={supportValue ?? undefined}
                proposalStatus={proposalStatus}
                setIsVotingModalOpen={setIsVotingModalOpen}
                isWhitelabel={isWhitelabel}
                daoId={daoId}
              />
              <ProposalExecutionButtons
                address={address}
                proposalStatus={proposalStatus}
                daoId={daoId}
                setIsQueueModalOpen={setIsQueueModalOpen}
                setIsExecuteModalOpen={setIsExecuteModalOpen}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const VotedBadge = ({ vote }: { vote: number }) => {
  return (
    <div className="flex flex-col items-end">
      <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
        You voted
      </p>
      {getVoteText(vote)}
    </div>
  );
};

const OffchainVotedBadge = ({
  label,
  proposalType,
}: {
  label: string | null;
  proposalType?: string | null;
}) => {
  return (
    <div className="flex flex-col items-end">
      <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
        You voted
      </p>
      {label && (
        <OffchainVoteLabelChip label={label} proposalType={proposalType} />
      )}
    </div>
  );
};

export const getVoteText = (vote: number) => {
  switch (vote) {
    case 0:
      return (
        <p className="text-error bg-surface-opacity-error font-inter rounded-full px-[6px] py-[2px] text-[12px] font-medium not-italic leading-[16px]">
          Against
        </p>
      );
    case 1:
      return (
        <p className="text-success bg-surface-opacity-success font-inter rounded-full px-[6px] py-[2px] text-[12px] font-medium not-italic leading-[16px]">
          For
        </p>
      );
    case 2:
      return (
        <p className="text-primary bg-surface-default font-inter rounded-full px-[6px] py-[2px] text-[12px] font-medium not-italic leading-[16px]">
          Abstain
        </p>
      );
  }
};
