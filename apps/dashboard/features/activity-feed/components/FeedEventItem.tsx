"use client";

import {
  Vote,
  FileText,
  ArrowRightLeft,
  Users,
  ExternalLink,
  CheckCircle2,
  XCircle,
  MinusCircle,
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
import { formatTimeFromNow } from "@/shared/utils/formatTimeFromNow";

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

const getEventColor = (type: FeedEventType) => {
  switch (type) {
    case "vote":
      return "text-chart-1";
    case "proposal":
      return "text-chart-4";
    case "transfer":
      return "text-chart-3";
    case "delegation":
      return "text-chart-5";
  }
};

const getEventBgColor = (type: FeedEventType) => {
  switch (type) {
    case "vote":
      return "bg-chart-1/10";
    case "proposal":
      return "bg-chart-4/10";
    case "transfer":
      return "bg-chart-3/10";
    case "delegation":
      return "bg-chart-5/10";
  }
};

const getRelevanceBadgeColor = (relevance: FeedEventRelevance) => {
  switch (relevance) {
    case "high":
      return "bg-surface-solid-error text-primary-foreground";
    case "medium":
      return "bg-surface-solid-warning text-primary-foreground";
    case "low":
      return "bg-surface-solid-success text-primary-foreground";
    case "none":
      return "bg-surface-contrast text-secondary";
  }
};

const getSupportIcon = (support: "for" | "against" | "abstain") => {
  switch (support) {
    case "for":
      return <CheckCircle2 className="text-success size-4" />;
    case "against":
      return <XCircle className="text-error size-4" />;
    case "abstain":
      return <MinusCircle className="text-secondary size-4" />;
  }
};

const getAddressTypeLabel = (
  type: "cex" | "dex" | "lending" | "wallet",
): string => {
  switch (type) {
    case "cex":
      return "CEX";
    case "dex":
      return "DEX";
    case "lending":
      return "Lending";
    case "wallet":
      return "Wallet";
  }
};

export const FeedEventItem = ({ event, className }: FeedEventItemProps) => {
  const { daoId } = useParams<{ daoId: DaoIdEnum }>();
  const config = daoConfig[daoId.toUpperCase() as DaoIdEnum];

  const Icon = getEventIcon(event.type);
  const iconColor = getEventColor(event.type);
  const iconBgColor = getEventBgColor(event.type);

  const timestamp = new Date(Number(event.timestamp) * 1000);
  const timeAgo = formatTimeFromNow(timestamp) + " ago";

  const formatAmount = (amount: string) => {
    const value = Number(amount) / Math.pow(10, config?.decimals ?? 18);
    return formatNumberUserReadable(value);
  };

  const baseExplorerUrl =
    config?.daoOverview?.chain?.blockExplorers?.default?.url ??
    "https://etherscan.io";
  const explorerUrl = `${baseExplorerUrl}/tx/${event.txHash}`;

  const renderEventContent = () => {
    switch (event.type) {
      case "vote":
        if (!event.vote) return null;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <EnsAvatar
                address={event.vote.voter as Address}
                showAvatar={true}
                size="sm"
                nameClassName="text-primary font-medium"
              />
              <span className="text-secondary">voted</span>
              {getSupportIcon(event.vote.support)}
              <span
                className={cn(
                  "font-medium capitalize",
                  event.vote.support === "for" && "text-success",
                  event.vote.support === "against" && "text-error",
                  event.vote.support === "abstain" && "text-secondary",
                )}
              >
                {event.vote.support}
              </span>
            </div>
            <Link
              href={`/${daoId}/governance/proposal/${event.vote.proposalId}`}
              className="text-secondary hover:text-primary line-clamp-1 text-sm transition-colors"
            >
              {event.vote.proposalTitle}
            </Link>
            <p className="text-dimmed text-xs">
              {formatAmount(event.vote.votingPower)} votes
            </p>
          </div>
        );

      case "proposal":
        if (!event.proposal) return null;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <EnsAvatar
                address={event.proposal.proposer as Address}
                showAvatar={true}
                size="sm"
                nameClassName="text-primary font-medium"
              />
              <span className="text-secondary">created a proposal</span>
            </div>
            <Link
              href={`/${daoId}/governance/proposal/${event.proposal.proposalId}`}
              className="text-primary hover:text-link line-clamp-2 font-medium transition-colors"
            >
              {event.proposal.proposalTitle}
            </Link>
          </div>
        );

      case "transfer":
        if (!event.transfer) return null;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-primary font-medium">
                {formatAmount(event.transfer.amount)}
              </span>
              <span className="text-secondary">transferred from</span>
              <EnsAvatar
                address={event.transfer.from as Address}
                showAvatar={false}
                nameClassName="text-primary font-medium"
              />
              <span className="text-dimmed text-xs">
                ({getAddressTypeLabel(event.transfer.fromType)})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-secondary">to</span>
              <EnsAvatar
                address={event.transfer.to as Address}
                showAvatar={false}
                nameClassName="text-primary font-medium"
              />
              <span className="text-dimmed text-xs">
                ({getAddressTypeLabel(event.transfer.toType)})
              </span>
            </div>
          </div>
        );

      case "delegation":
        if (!event.delegation) return null;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1">
              <EnsAvatar
                address={event.delegation.delegator as Address}
                showAvatar={true}
                size="sm"
                nameClassName="text-primary font-medium"
              />
              <span className="text-secondary">delegated</span>
              <span className="text-primary font-medium">
                {formatAmount(event.delegation.amount)}
              </span>
              <span className="text-secondary">to</span>
              <EnsAvatar
                address={event.delegation.delegate as Address}
                showAvatar={false}
                nameClassName="text-primary font-medium"
              />
            </div>
            {event.delegation.previousDelegate &&
              event.delegation.previousDelegate !==
                "0x0000000000000000000000000000000000000000" && (
                <p className="text-dimmed text-xs">
                  Previously delegated to{" "}
                  <EnsAvatar
                    address={event.delegation.previousDelegate as Address}
                    showAvatar={false}
                    nameClassName="text-dimmed"
                  />
                </p>
              )}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "bg-surface-default hover:bg-surface-contrast border-border-default flex gap-3 border-b px-4 py-3 transition-colors",
        className,
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          iconBgColor,
        )}
      >
        <Icon className={cn("size-5", iconColor)} />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {renderEventContent()}
      </div>

      {/* Metadata */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          {event.relevance !== "none" && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                getRelevanceBadgeColor(event.relevance),
              )}
            >
              {event.relevance}
            </span>
          )}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-primary transition-colors"
            title="View on explorer"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
        <span className="text-dimmed text-xs">{timeAgo}</span>
      </div>
    </div>
  );
};
