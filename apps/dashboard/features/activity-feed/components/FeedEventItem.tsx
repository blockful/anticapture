"use client";

import {
  Vote,
  FileText,
  ArrowRightLeft,
  Users,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Address } from "viem";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  FeedEvent,
  FeedEventRelevance,
  FeedEventType,
} from "@/features/activity-feed/types";
import daoConfig from "@/shared/dao-config";

interface FeedEventItemProps {
  event: FeedEvent;
  className?: string;
}

const getEventIcon = (type: FeedEventType) => {
  switch (type) {
    case "vote":
      return Vote;
    case "proposal":
      return FileText;
    case "transfer":
      return ArrowRightLeft;
    case "delegation":
      return Users;
  }
};

const getEventIconColor = (type: FeedEventType) => {
  switch (type) {
    case "vote":
      return "text-dimmed";
    case "proposal":
      return "text-dimmed";
    case "transfer":
      return "text-dimmed";
    case "delegation":
      return "text-dimmed";
  }
};

const getRelevanceLabel = (relevance: FeedEventRelevance) => {
  switch (relevance) {
    case "high":
      return "High Relevance";
    case "medium":
      return "Medium Relevance";
    case "low":
      return "Low Relevance";
    case "none":
      return "No Relevance";
  }
};

const getRelevanceColor = (relevance: FeedEventRelevance) => {
  switch (relevance) {
    case "high":
      return "text-error";
    case "medium":
      return "text-warning";
    case "low":
      return "text-success";
    case "none":
      return "text-secondary";
  }
};

const getEventTypeLabel = (type: FeedEventType) => {
  switch (type) {
    case "vote":
      return "Vote";
    case "proposal":
      return "Proposal Creation";
    case "transfer":
      return "Transfer";
    case "delegation":
      return "Delegation";
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const FeedEventItem = ({ event, className }: FeedEventItemProps) => {
  const { daoId } = useParams<{ daoId: DaoIdEnum }>();
  const config = daoConfig[daoId.toUpperCase() as DaoIdEnum];

  const Icon = getEventIcon(event.type);
  const iconColor = getEventIconColor(event.type);

  const formatAmount = (amount: string) => {
    const value = Number(amount) / Math.pow(10, config?.decimals ?? 18);
    return formatNumberUserReadable(value);
  };

  const tokenSymbol = config?.daoOverview?.token?.symbol ?? "tokens";

  const baseExplorerUrl =
    config?.daoOverview?.chain?.blockExplorers?.default?.url ??
    "https://etherscan.io";
  const explorerUrl = `${baseExplorerUrl}/tx/${event.txHash}`;

  const renderEventContent = () => {
    switch (event.type) {
      case "vote":
        if (!event.vote) return null;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <EnsAvatar
              address={event.vote.voter as Address}
              showAvatar={true}
              size="xs"
              nameClassName="text-primary font-medium"
            />
            <span className="text-dimmed">
              ({formatAmount(event.vote.votingPower)} {tokenSymbol} voting
              power)
            </span>
            <span className="text-secondary">voted</span>
            <CheckCircle2 className="text-success size-4" />
            <span className="text-success font-medium capitalize">
              {event.vote.support === "for"
                ? "Yes"
                : event.vote.support === "against"
                  ? "No"
                  : "Abstain"}
            </span>
            <span className="text-secondary">on proposal</span>
            <Link
              href={`/${daoId}/governance/proposal/${event.vote.proposalId}`}
              className="text-primary hover:text-link line-clamp-1 font-medium transition-colors"
            >
              {event.vote.proposalTitle}
            </Link>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary ml-1 transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        );

      case "proposal":
        if (!event.proposal) return null;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <EnsAvatar
              address={event.proposal.proposer as Address}
              showAvatar={true}
              size="xs"
              nameClassName="text-primary font-medium"
            />
            <span className="text-dimmed">
              ({formatAmount(event.proposal.votingPower)} {tokenSymbol} voting
              power)
            </span>
            <span className="text-secondary">created the proposal</span>
            <Link
              href={`/${daoId}/governance/proposal/${event.proposal.proposalId}`}
              className="text-primary hover:text-link line-clamp-1 font-medium transition-colors"
            >
              {event.proposal.proposalTitle}
            </Link>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary ml-1 transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        );

      case "transfer":
        if (!event.transfer) return null;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <EnsAvatar
              address={event.transfer.from as Address}
              showAvatar={true}
              size="xs"
              nameClassName="text-primary font-medium"
            />
            <span className="text-secondary">transferred</span>
            <span className="text-success font-medium">
              {formatAmount(event.transfer.amount)} {tokenSymbol}
            </span>
            <span className="text-secondary">to</span>
            <EnsAvatar
              address={event.transfer.to as Address}
              showAvatar={true}
              size="xs"
              nameClassName="text-primary font-medium"
            />
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary ml-1 transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        );

      case "delegation": {
        if (!event.delegation) return null;
        const hasRedelegation =
          event.delegation.previousDelegate &&
          event.delegation.previousDelegate !==
            "0x0000000000000000000000000000000000000000";

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <EnsAvatar
              address={event.delegation.delegator as Address}
              showAvatar={true}
              size="xs"
              nameClassName="text-primary font-medium"
            />
            <span className="text-secondary">
              {hasRedelegation ? "redelegated" : "delegated"}
            </span>
            <span className="text-success font-medium">
              {formatAmount(event.delegation.amount)} {tokenSymbol}
            </span>
            {hasRedelegation && (
              <>
                <span className="text-secondary">from</span>
                <EnsAvatar
                  address={event.delegation.previousDelegate as Address}
                  showAvatar={true}
                  size="xs"
                  nameClassName="text-primary font-medium"
                />
              </>
            )}
            <span className="text-secondary">to</span>
            <EnsAvatar
              address={event.delegation.delegate as Address}
              showAvatar={true}
              size="xs"
              nameClassName="text-primary font-medium"
            />
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary ml-1 transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        );
      }
    }
  };

  return (
    <div
      className={cn(
        "hover:bg-surface-contrast flex items-start gap-2 py-2 transition-colors",
        className,
      )}
    >
      {/* Icon */}
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor)} />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Main action line */}
        <div className="text-sm">{renderEventContent()}</div>

        {/* Metadata line */}
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn("font-medium", getRelevanceColor(event.relevance))}
          >
            {getRelevanceLabel(event.relevance)}
          </span>
          <span className="text-dimmed">•</span>
          <span className="text-secondary">
            {getEventTypeLabel(event.type)}
          </span>
          <span className="text-dimmed">•</span>
          <span className="text-secondary">
            {formatTime(Number(event.timestamp))}
          </span>
        </div>
      </div>
    </div>
  );
};
