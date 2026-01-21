"use client";

import {
  FileText,
  ExternalLink,
  CheckCircle2,
  ArrowLeftRight,
  Inbox,
  HeartHandshake,
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
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { BulletDivider } from "@/shared/components/design-system/section";

interface FeedEventItemProps {
  event: FeedEvent;
  className?: string;
  isLast?: boolean;
}

const getBadgeIcon = (type: FeedEventType) => {
  switch (type) {
    case "vote":
      return Inbox;
    case "proposal":
      return FileText;
    case "transfer":
      return ArrowLeftRight;
    case "delegation":
      return HeartHandshake;
  }
};

const getBadgeVariant = (relevance: FeedEventRelevance) => {
  switch (relevance) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    case "none":
      return "secondary";
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

export const FeedEventItem = ({
  event,
  className,
  isLast = false,
}: FeedEventItemProps) => {
  const { daoId } = useParams<{ daoId: DaoIdEnum }>();
  const config = daoConfig[daoId.toUpperCase() as DaoIdEnum];

  const BadgeIcon = getBadgeIcon(event.type);
  const badgeVariant = getBadgeVariant(event.relevance);

  const formatAmount = (amount: string) => {
    const value = Number(amount) / Math.pow(10, config?.decimals ?? 18);
    return formatNumberUserReadable(value);
  };

  const tokenSymbol = config?.name ?? daoId.toUpperCase();

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
              size="sm"
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
              size="sm"
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
              size="sm"
              nameClassName="text-primary font-medium"
            />
            <span className="text-secondary">transferred</span>
            <span className="text-primary font-medium">
              {formatAmount(event.transfer.amount)} {tokenSymbol}
            </span>
            <span className="text-secondary">to</span>
            <EnsAvatar
              address={event.transfer.to as Address}
              showAvatar={true}
              size="sm"
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
              size="sm"
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
                  size="sm"
                  nameClassName="text-primary font-medium"
                />
              </>
            )}
            <span className="text-secondary">to</span>
            <EnsAvatar
              address={event.delegation.delegate as Address}
              showAvatar={true}
              size="sm"
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
    <div className={cn("flex items-start gap-4 pb-1", className)}>
      {/* Badge and Connector */}
      <div>
        <BadgeStatus
          variant={badgeVariant}
          icon={BadgeIcon}
          className="size-6"
          iconVariant={badgeVariant}
        />
        {!isLast && (
          <div className="mt-1 flex w-6 justify-center">
            <DividerDefault isVertical className="h-10" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Main action line */}
        <div className="text-sm">{renderEventContent()}</div>

        {/* Metadata line */}
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn("font-medium", getRelevanceColor(event.relevance))}
          >
            {getRelevanceLabel(event.relevance)}
          </span>
          <BulletDivider></BulletDivider>
          <span className="text-secondary">
            {getEventTypeLabel(event.type)}
          </span>
          <BulletDivider></BulletDivider>
          <span className="text-secondary">
            {formatTime(Number(event.timestamp))}
          </span>
        </div>
      </div>
    </div>
  );
};
