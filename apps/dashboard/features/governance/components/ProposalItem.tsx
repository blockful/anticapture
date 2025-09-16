"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { Proposal, ProposalStatus } from "@/features/governance/types";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Address } from "viem";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import { BulletDivider } from "@/features/governance/components/BulletDivider";

interface ProposalItemProps {
  proposal: Proposal;
  className?: string;
}

const getTextStatusColor = (status: ProposalStatus) => {
  switch (status) {
    case ProposalStatus.PENDING:
      return "text-warning";
    case ProposalStatus.ONGOING:
      return "text-primary";
    case ProposalStatus.EXECUTED:
      return "text-success";
    case ProposalStatus.DEFEATED:
      return "text-error";
    case ProposalStatus.CANCELLED:
      return "text-error";
    case ProposalStatus.QUEUED:
      return "text-primary";
    case ProposalStatus.SUCCEEDED:
      return "text-success";
    case ProposalStatus.EXPIRED:
      return "text-error";
    case ProposalStatus.NO_QUORUM:
      return "text-error";
    default:
      return "text-secondary";
  }
};

const getBackgroundStatusColor = (status: ProposalStatus) => {
  switch (status) {
    case ProposalStatus.PENDING:
      return "bg-warning";
    case ProposalStatus.ONGOING:
      return "bg-primary";
    case ProposalStatus.EXECUTED:
      return "bg-success";
    case ProposalStatus.DEFEATED:
      return "bg-error";
    case ProposalStatus.CANCELLED:
      return "bg-error";
    case ProposalStatus.QUEUED:
      return "bg-primary";
    case ProposalStatus.SUCCEEDED:
      return "bg-success";
    case ProposalStatus.EXPIRED:
      return "bg-error";
    case ProposalStatus.NO_QUORUM:
      return "bg-error";
    default:
      return "bg-secondary";
  }
};

const getStatusText = (status: ProposalStatus) => {
  switch (status) {
    case ProposalStatus.PENDING:
      return "Pending";
    case ProposalStatus.ONGOING:
      return "Ongoing";
    case ProposalStatus.EXECUTED:
      return "Executed";
    case ProposalStatus.DEFEATED:
      return "Defeated";
    case ProposalStatus.CANCELLED:
      return "Cancelled";
    case ProposalStatus.QUEUED:
      return "Queued";
    case ProposalStatus.SUCCEEDED:
      return "Succeeded";
    case ProposalStatus.EXPIRED:
      return "Expired";
    case ProposalStatus.NO_QUORUM:
      return "No Quorum";
    default:
      return status;
  }
};

export const ProposalItem = ({ proposal, className }: ProposalItemProps) => {
  const daoId = useParams().daoId as DaoIdEnum;
  const quorumPercentage = proposal.votes.total
    ? (Number(proposal.quorum) / Number(proposal.votes.total)) * 100
    : 0;

  return (
    <Link
      href={`/${daoId}/governance/proposal/${proposal.id}`}
      className={cn(
        "text-primary bg-surface-default hover:bg-surface-contrast relative flex w-full cursor-pointer flex-col items-center justify-between gap-3 px-3 py-3 transition-colors duration-300 md:flex-row md:gap-6",
        className,
      )}
      id={proposal.id}
    >
      <div
        className={cn(
          "absolute left-0 top-1/2 h-[calc(100%-24px)] w-[2px] -translate-y-1/2",
          getBackgroundStatusColor(proposal.status),
        )}
      />

      <div className="flex w-full flex-col items-start justify-between gap-0.5 md:w-auto">
        <h3 className="text-primary">{proposal.title}</h3>
        <div className="font-inter text-secondary flex items-center justify-center gap-2 text-[14px] font-normal not-italic leading-[20px]">
          <p className={getTextStatusColor(proposal.status)}>
            {getStatusText(proposal.status)}
          </p>
          <BulletDivider />
          <p>{proposal.timeText}</p>
          <BulletDivider />
          <span>
            by{" "}
            <EnsAvatar
              address={proposal.proposer as Address}
              showAvatar={false}
              nameClassName="text-secondary"
            />
          </span>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-center gap-1 md:w-[220px]">
        <div className="font-inter text-secondary flex w-full items-center justify-between gap-2 text-[14px] font-normal not-italic leading-5">
          <p>
            {" "}
            {proposal.votes.total
              ? formatNumberUserReadable(Number(proposal.votes.total)) +
                " votes"
              : "Waiting to start"}
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="text-success size-4" />
              <p>{proposal.votes.forPercentage}%</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <XCircle className="text-error size-4" />
              <p>{proposal.votes.againstPercentage}%</p>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-center gap-2">
          <div className="bg-surface-hover relative flex h-1 w-full rounded-full">
            <div
              style={{
                width: `${proposal.votes.forPercentage}%`,
              }}
              className={cn("bg-success h-full rounded-l-full")}
            />
            <div
              style={{
                width: `${proposal.votes.againstPercentage}%`,
              }}
              className={cn("bg-error h-full rounded-r-full")}
            />

            {quorumPercentage < 100 && (
              <div
                className="bg-primary outline-surface-default absolute left-1/2 top-1/2 h-2 w-[2px] -translate-y-1/2 outline-[2px]"
                style={{
                  left: `${quorumPercentage}%`,
                }}
              />
            )}
          </div>
        </div>
        <div className="relative flex w-full">
          {quorumPercentage < 100 && (
            <>
              <div
                style={{ left: `${quorumPercentage}%` }}
                className="font-inter text-secondary absolute flex -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap text-xs font-medium not-italic leading-4"
              >
                Quorum: {formatNumberUserReadable(Number(proposal.quorum))}
              </div>
              <div className="h-4 w-full"></div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};
