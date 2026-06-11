"use client";

import { CheckCircle2, CircleMinus, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { ProposalSourceBadge } from "@/features/governance/components/proposal-overview/ProposalSourceBadge";
import type { OffchainProposalItem as OffchainProposalData } from "@/features/governance/hooks/useOffchainProposals";
import type { Proposal } from "@/features/governance/types";
import { ProposalState, ProposalStatus } from "@/features/governance/types";
import { getTimeText } from "@/features/governance/utils/getTimeText";
import {
  getOffchainProposalStatus,
  normalizeChoices,
  normalizeScores,
} from "@/features/governance/utils/offchainProposal";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BadgeStatus } from "@/shared/components/design-system/badges";
import { BulletDivider } from "@/shared/components/design-system/section";
import daoConfigByDaoId from "@/shared/dao-config";
import { useAccountPower } from "@/features/governance/hooks/useAccountPower";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { getDaoProposalPath } from "@/shared/utils/whitelabel";

type ProposalItemProps =
  | { proposal: Proposal; offchainProposal?: never; className?: string }
  | {
      proposal?: never;
      offchainProposal: OffchainProposalData;
      className?: string;
    };

export const getTextStatusColor = (status: ProposalStatus) => {
  switch (status) {
    case ProposalStatus.PENDING:
      return "text-warning";
    case ProposalStatus.ONGOING:
      return "text-link";
    case ProposalStatus.EXECUTED:
      return "text-success";
    case ProposalStatus.DEFEATED:
      return "text-error";
    case ProposalStatus.CANCELED:
      return "text-error";
    case ProposalStatus.QUEUED:
      return "text-success";
    case ProposalStatus.PENDING_EXECUTION:
      return "text-warning";
    case ProposalStatus.SUCCEEDED:
      return "text-success";
    case ProposalStatus.EXPIRED:
      return "text-error";
    case ProposalStatus.NO_QUORUM:
      return "text-secondary";
    case ProposalStatus.CLOSED:
      return "text-secondary";
    default:
      return "text-secondary";
  }
};

export const getStatusColorBar = (status: ProposalStatus) => {
  switch (status) {
    case ProposalStatus.PENDING:
      return "bg-warning";
    case ProposalStatus.ONGOING:
      return "bg-link";
    case ProposalStatus.EXECUTED:
      return "bg-success";
    case ProposalStatus.DEFEATED:
      return "bg-error";
    case ProposalStatus.CANCELED:
      return "bg-error";
    case ProposalStatus.QUEUED:
      return "bg-success";
    case ProposalStatus.PENDING_EXECUTION:
      return "bg-warning";
    case ProposalStatus.SUCCEEDED:
      return "bg-success";
    case ProposalStatus.EXPIRED:
      return "bg-error";
    case ProposalStatus.NO_QUORUM:
      return "bg-secondary";
    case ProposalStatus.CLOSED:
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
};

export const getBackgroundStatusColor = (status: ProposalStatus) => {
  switch (status) {
    case ProposalStatus.PENDING:
      return "bg-surface-opacity-warning";
    case ProposalStatus.ONGOING:
      return "bg-surface-opacity-brand";
    case ProposalStatus.EXECUTED:
      return "bg-surface-opacity-success";
    case ProposalStatus.DEFEATED:
      return "bg-surface-opacity-error";
    case ProposalStatus.CANCELED:
      return "bg-surface-opacity-error";
    case ProposalStatus.QUEUED:
      return "bg-surface-opacity-success";
    case ProposalStatus.PENDING_EXECUTION:
      return "bg-surface-opacity-warning";
    case ProposalStatus.SUCCEEDED:
      return "bg-surface-opacity-success";
    case ProposalStatus.EXPIRED:
      return "bg-surface-opacity-error";
    case ProposalStatus.NO_QUORUM:
      return "bg-surface-opacity";
    case ProposalStatus.CLOSED:
      return "bg-surface-opacity";
    default:
      return "bg-surface-opacity";
  }
};

export const getStatusText = (status: ProposalStatus) => {
  switch (status) {
    case ProposalStatus.PENDING:
      return "Pending";
    case ProposalStatus.ONGOING:
      return "Ongoing";
    case ProposalStatus.EXECUTED:
      return "Executed";
    case ProposalStatus.DEFEATED:
      return "Defeated";
    case ProposalStatus.CANCELED:
      return "Cancelled";
    case ProposalStatus.QUEUED:
      return "Queued";
    case ProposalStatus.PENDING_EXECUTION:
      return "Pending Execution";
    case ProposalStatus.SUCCEEDED:
      return "Pending Queue";
    case ProposalStatus.EXPIRED:
      return "Expired";
    case ProposalStatus.NO_QUORUM:
      return "No Quorum";
    case ProposalStatus.CLOSED:
      return "Closed";
    default:
      return status;
  }
};

type ProposalVoterBadgeProps = {
  address: string;
  daoId: DaoIdEnum;
  proposalId: string;
  decimals: number;
};

const ProposalVoterBadge = ({
  address,
  daoId,
  proposalId,
  decimals,
}: ProposalVoterBadgeProps) => {
  const {
    data: { votes },
  } = useAccountPower({ address, daoId, proposalId, decimals });
  const supportValue =
    votes?.items[0]?.support != null
      ? Number(votes.items[0].support)
      : undefined;

  if (supportValue === undefined) return null;

  const variant =
    supportValue === 1 ? "success" : supportValue === 0 ? "error" : "dimmed";
  const icon =
    supportValue === 1
      ? CheckCircle2
      : supportValue === 0
        ? XCircle
        : CircleMinus;

  return (
    <>
      <BulletDivider />
      <BadgeStatus variant={variant} icon={icon}>
        You voted{" "}
        {supportValue === 1
          ? "For"
          : supportValue === 0
            ? "Against"
            : "Abstain"}
      </BadgeStatus>
    </>
  );
};

export const ProposalItem = ({
  proposal,
  offchainProposal,
  className,
}: ProposalItemProps) => {
  const daoIdParam = useParams().daoId as string;
  const daoId = daoIdParam.toUpperCase() as DaoIdEnum;
  const pathname = usePathname();
  const { address } = useAccount();
  const decimals = daoConfigByDaoId[daoId].decimals;

  const {
    offchainScores,
    totalOffchainVotes,
    offchainForPercentage,
    offchainAgainstPercentage,
    leadingChoice,
  } = useMemo(() => {
    const scores = normalizeScores(offchainProposal?.scores);
    const choices = normalizeChoices(offchainProposal?.choices);

    if (!offchainProposal)
      return {
        offchainScores: scores,
        totalOffchainVotes: 0,
        offchainForPercentage: 0,
        offchainAgainstPercentage: 0,
        leadingChoice: null,
      };

    const items = choices.map((label, i) => ({
      label,
      score: scores[i] ?? 0,
    }));
    const total = items.reduce((sum, c) => sum + c.score, 0);
    const withPct = items.map((c) => ({
      ...c,
      percentage: total > 0 ? (c.score / total) * 100 : 0,
    }));

    const forItem = withPct.find((c) => c.label.toLowerCase() === "for");
    const againstItem = withPct.find(
      (c) => c.label.toLowerCase() === "against",
    );

    // Polls with more than two options surface which option is leading
    const leading =
      withPct.length > 2 && total > 0
        ? withPct.reduce((max, c) => (c.score > max.score ? c : max))
        : null;

    return {
      offchainScores: scores,
      totalOffchainVotes: total,
      offchainForPercentage: forItem?.percentage ?? 0,
      offchainAgainstPercentage: againstItem?.percentage ?? 0,
      leadingChoice: leading,
    };
  }, [offchainProposal?.scores, offchainProposal?.choices, offchainProposal]);

  if (offchainProposal) {
    const status = getOffchainProposalStatus(
      offchainProposal.state,
      offchainProposal.type ?? "single-choice",
      offchainScores,
    );
    const isBasic = offchainProposal.type === "basic";
    const timeText = getTimeText(
      String(offchainProposal.start),
      String(offchainProposal.end),
    );
    const encodedId = encodeURIComponent(offchainProposal.id);

    return (
      <Link
        href={getDaoProposalPath({
          daoId,
          pathname,
          proposalId: encodedId,
          isOffchain: true,
        })}
        className={cn(
          "text-primary bg-surface-default hover:bg-surface-contrast rounded-base relative flex w-full cursor-pointer flex-col items-center justify-between gap-3 px-3 py-3 transition-colors duration-300 lg:flex-row lg:gap-6",
          className,
        )}
        prefetch={true}
        id={offchainProposal.id}
      >
        <div
          className={cn(
            "absolute left-0 top-1/2 h-[calc(100%-24px)] w-[2px] -translate-y-1/2",
            getStatusColorBar(status),
          )}
        />

        <div className="flex w-full flex-col items-start justify-between gap-0.5 lg:w-auto">
          <h3 className="text-primary">{offchainProposal.title}</h3>
          <div className="font-inter text-secondary flex flex-wrap items-center gap-2 text-[14px] font-normal not-italic leading-[20px]">
            <ProposalSourceBadge source="offchain" />
            <p className={getTextStatusColor(status)}>
              {getStatusText(status)}
            </p>
            <BulletDivider />
            <p>{timeText}</p>
            <BulletDivider />
            <span>
              By{" "}
              <EnsAvatar
                address={offchainProposal.author as Address}
                showAvatar={false}
                nameClassName="text-secondary"
              />
            </span>
          </div>
        </div>

        {isBasic ? (
          <div className="flex w-full shrink-0 flex-col items-center gap-1 lg:w-[220px]">
            <div className="font-inter text-secondary flex w-full items-center justify-between gap-2 text-[14px] font-normal not-italic leading-5">
              <p className="whitespace-nowrap">
                {totalOffchainVotes > 0
                  ? `${formatNumberUserReadable(totalOffchainVotes)} votes`
                  : "No votes yet"}
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="text-success size-4" />
                  <p>{offchainForPercentage.toFixed(0)}%</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <XCircle className="text-error size-4" />
                  <p>{offchainAgainstPercentage.toFixed(0)}%</p>
                </div>
              </div>
            </div>

            <div className="flex w-full items-center justify-center gap-2">
              <div className="bg-surface-hover relative flex h-1 w-full">
                <div
                  style={{ width: `${offchainForPercentage}%` }}
                  className={cn("bg-success h-full")}
                />
                <div
                  style={{ width: `${offchainAgainstPercentage}%` }}
                  className={cn("bg-error h-full")}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="font-inter text-secondary flex w-full shrink-0 flex-col items-end justify-center not-italic lg:w-[220px]">
            <p className="whitespace-nowrap text-[14px] font-normal leading-5">
              {totalOffchainVotes > 0
                ? `${formatNumberUserReadable(totalOffchainVotes)} votes`
                : "No votes yet"}
            </p>
            {leadingChoice ? (
              <p className="whitespace-nowrap text-xs font-medium leading-4">
                Leading: {leadingChoice.label} ·{" "}
                {leadingChoice.percentage.toFixed(0)}%
              </p>
            ) : null}
          </div>
        )}
      </Link>
    );
  }

  const quorumPercentage = proposal!.votes.total
    ? (Number(proposal!.quorum) / Number(proposal!.votes.total)) * 100
    : 0;

  // Vote progress only applies once voting has started
  const hasVotingStarted = proposal!.state !== ProposalState.WAITING_TO_START;

  return (
    <Link
      href={getDaoProposalPath({
        daoId,
        pathname,
        proposalId: proposal!.id,
      })}
      className={cn(
        "text-primary bg-surface-default hover:bg-surface-contrast rounded-base relative flex w-full cursor-pointer flex-col items-center justify-between gap-3 px-3 py-3 transition-colors duration-300 lg:flex-row lg:gap-6",
        className,
      )}
      prefetch={true}
      id={proposal!.id}
    >
      <div
        className={cn(
          "absolute left-0 top-1/2 h-[calc(100%-24px)] w-[2px] -translate-y-1/2",
          getStatusColorBar(proposal!.status),
        )}
      />

      <div className="flex w-full flex-col items-start justify-between gap-0.5 lg:w-auto">
        <h3 className="text-primary">{proposal!.title}</h3>
        <div className="font-inter text-secondary flex flex-wrap items-center gap-2 text-[14px] font-normal not-italic leading-[20px]">
          <ProposalSourceBadge source="onchain" />
          <p className={getTextStatusColor(proposal!.status)}>
            {getStatusText(proposal!.status)}
          </p>
          <BulletDivider />
          <p>{proposal!.timeText}</p>
          <BulletDivider />
          <span>
            By{" "}
            <EnsAvatar
              address={proposal!.proposer as Address}
              showAvatar={false}
              nameClassName="text-secondary"
            />
          </span>
          <ProposalVoterBadge
            address={address ?? ""}
            daoId={daoId}
            proposalId={proposal!.id}
            decimals={decimals}
          />
        </div>
      </div>

      {hasVotingStarted ? (
        <div className="flex w-full shrink-0 flex-col items-center gap-1 lg:w-[220px]">
          <div className="font-inter text-secondary flex w-full items-center justify-between gap-2 text-[14px] font-normal not-italic leading-5">
            <p>
              {`${formatNumberUserReadable(Number(proposal!.votes.total))} votes`}
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="text-success size-4" />
                <p>{proposal!.votes.forPercentage}%</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <XCircle className="text-error size-4" />
                <p>{proposal!.votes.againstPercentage}%</p>
              </div>
            </div>
          </div>
          <div className="flex w-full items-center justify-center gap-2">
            <div className="bg-surface-hover relative flex h-1 w-full">
              <div
                style={{ width: `${proposal!.votes.forPercentage}%` }}
                className={cn("bg-success h-full")}
              />
              <div
                style={{ width: `${proposal!.votes.againstPercentage}%` }}
                className={cn("bg-error h-full")}
              />
              <div
                style={{ width: `${proposal!.votes.abstainPercentage}%` }}
                className={cn("bg-secondary h-full")}
              />

              {quorumPercentage < 100 && (
                <div
                  className="bg-primary outline-surface-default absolute left-1/2 top-1/2 h-2 w-[2px] -translate-y-1/2 outline-2"
                  style={{ left: `${quorumPercentage}%` }}
                />
              )}
            </div>
          </div>
          <div className="relative flex w-full">
            {quorumPercentage < 100 && (
              <>
                <div
                  style={{
                    left: `${quorumPercentage}%`,
                    transform: `translateX(-${quorumPercentage}%)`,
                  }}
                  className="font-inter text-secondary absolute flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium not-italic leading-4"
                >
                  Quorum: {formatNumberUserReadable(Number(proposal!.quorum))}
                </div>
                <div className="h-4 w-full"></div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex w-full shrink-0 items-center justify-end lg:w-[220px]">
          <p className="font-inter text-secondary text-[14px] font-normal not-italic leading-5">
            Waiting to start
          </p>
        </div>
      )}
    </Link>
  );
};
