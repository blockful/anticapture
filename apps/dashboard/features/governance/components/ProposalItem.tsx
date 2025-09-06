"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/shared/utils";
import {
  Proposal,
  ProposalStatus,
  // ProposalState,
} from "@/features/governance/types";

interface ProposalItemProps {
  proposal: Proposal;
  className?: string;
}

// const getStatusBadgeVariant = (status: ProposalStatus) => {
//   switch (status) {
//     case ProposalStatus.PENDING:
//       return "warning";
//     case ProposalStatus.ONGOING:
//       return "primary";
//     case ProposalStatus.EXECUTED:
//       return "success";
//     case ProposalStatus.DEFEATED:
//       return "error";
//     case ProposalStatus.CANCELLED:
//       return "error";
//     default:
//       return "secondary";
//   }
// };

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
    default:
      return status;
  }
};

// const getTimeText = (proposal: Proposal) => {
//   if (proposal.state === ProposalState.WAITING_TO_START) {
//     return proposal.timeRemaining || "Waiting to start";
//   }
//   if (proposal.state === ProposalState.ACTIVE) {
//     return proposal.timeRemaining || "Active";
//   }
//   return proposal.timeAgo || "Completed";
// };

// const formatVotes = (votes: number): string => {
//   if (votes >= 1000000) {
//     return `${(votes / 1000000).toFixed(1)}M`;
//   }
//   if (votes >= 1000) {
//     return `${(votes / 1000).toFixed(1)}K`;
//   }
//   return votes.toString();
// };

export const ProposalItem = ({ proposal, className }: ProposalItemProps) => {
  // const statusVariant = getStatusBadgeVariant(proposal.status);
  // const statusText = getStatusText(proposal.status);
  // const timeText = getTimeText(proposal);
  // const formattedVotes = formatVotes(proposal.votes.total);
  // const quorumText = formatVotes(proposal.quorum);

  return (
    <div
      className={cn(
        "text-primary bg-surface-default relative flex w-full flex-col items-center justify-between gap-6 border-b-2 border-b-white/10 px-3 py-3 sm:border-none sm:px-5 sm:py-7 md:h-[72px] md:flex-row",
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

      <div className="flex w-full flex-col items-start justify-between md:w-auto">
        <h3 className="text-primary">{proposal.title}</h3>
        <div className="font-inter text-secondary flex items-center justify-center gap-2 text-[14px] font-normal not-italic leading-[20px]">
          <p className={getTextStatusColor(proposal.status)}>
            {getStatusText(proposal.status)}
          </p>
          <BulletDivider />
          <p>10d to start</p>
          <BulletDivider />
          <span>by</span>
          <p>proposer</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-1 md:w-[220px]">
        <div className="font-inter text-secondary flex w-full items-center justify-between gap-2 text-[14px] font-normal not-italic leading-5">
          <p> Waiting to start</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="text-success size-4" />
              <p>0%</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <XCircle className="text-error size-4" />
              <p>0%</p>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-center gap-2">
          <div className="bg-surface-hover relative flex h-1 w-full rounded-full">
            <div className="bg-success h-full w-[80px] rounded-l-full" />
            <div className="bg-error h-full w-[110px] rounded-r-full" />

            <div className="bg-primary outline-surface-default absolute left-1/2 top-1/2 h-2 w-[2px] -translate-y-1/2 outline-[2px]" />
          </div>
        </div>
        <div className="font-inter text-secondary flex items-center justify-center gap-2 text-xs font-medium not-italic leading-4">
          Quorum: 1M
        </div>
      </div>
    </div>
  );
};

const BulletDivider = () => {
  return <div className="bg-surface-hover h-1 w-1 rounded-full" />;
};
