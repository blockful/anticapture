"use client";

import {
  FileText,
  ExternalLink,
  CheckCircle2,
  ArrowLeftRight,
  Inbox,
  HeartHandshake,
  ArrowUpDown,
  Clock,
} from "lucide-react";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Address, formatUnits, zeroAddress } from "viem";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  FeedEvent,
  FeedEventRelevance,
  FeedEventType,
} from "@/features/feed/types";
import daoConfig from "@/shared/dao-config";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { BulletDivider } from "@/shared/components/design-system/section";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";

interface FeedEventItemProps {
  event: FeedEvent;
  className?: string;
  isLast?: boolean;
}

const getBadgeIcon = (type: FeedEventType) => {
  switch (type) {
    case FeedEventType.Vote:
      return Inbox;
    case FeedEventType.Proposal:
      return FileText;
    case FeedEventType.Transfer:
      return ArrowLeftRight;
    case FeedEventType.Delegation:
      return HeartHandshake;
    case FeedEventType.DelegationVotesChanged:
      return ArrowUpDown;
    case FeedEventType.ProposalExtended:
      return Clock;
  }
};

const getBadgeVariant = (relevance: FeedEventRelevance) => {
  switch (relevance) {
    case FeedEventRelevance.High:
      return "error";
    case FeedEventRelevance.Medium:
      return "warning";
    case FeedEventRelevance.Low:
      return "success";
    default:
      return "secondary";
  }
};

const getRelevanceLabel = (relevance: FeedEventRelevance) => {
  switch (relevance) {
    case FeedEventRelevance.High:
      return "High Relevance";
    case FeedEventRelevance.Medium:
      return "Medium Relevance";
    case FeedEventRelevance.Low:
      return "Low Relevance";
    default:
      return "No Relevance";
  }
};

const getRelevanceColor = (relevance: FeedEventRelevance) => {
  switch (relevance) {
    case FeedEventRelevance.High:
      return "text-error";
    case FeedEventRelevance.Medium:
      return "text-warning";
    case FeedEventRelevance.Low:
      return "text-success";
    default:
      return "text-secondary";
  }
};

const getEventTypeLabel = (type: FeedEventType) => {
  switch (type) {
    case FeedEventType.Vote:
      return "Vote";
    case FeedEventType.Proposal:
      return "Proposal Creation";
    case FeedEventType.Transfer:
      return "Transfer";
    case FeedEventType.Delegation:
      return "Delegation";
    case FeedEventType.DelegationVotesChanged:
      return "Delegation Votes Changed";
    case FeedEventType.ProposalExtended:
      return "Proposal Extended";
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
    const value = formatUnits(BigInt(amount), config.decimals);
    return formatNumberUserReadable(Number(value));
  };

  const tokenSymbol = config?.name ?? daoId.toUpperCase();

  const baseExplorerUrl =
    config?.daoOverview?.chain?.blockExplorers?.default?.url ??
    "https://etherscan.io";
  const explorerUrl = `${baseExplorerUrl}/tx/${event.txHash}`;

  const renderEventContent = () => {
    switch (event.type) {
      case FeedEventType.Vote:
        if (!event.metadata) return null;
        return (
          <p className="leading-relaxed">
            <span className="inline-flex items-center gap-1.5 align-middle">
              <EnsAvatar
                address={event.metadata.voter}
                showAvatar={true}
                size="xs"
                nameClassName="text-primary font-medium"
              />
            </span>{" "}
            <CopyAndPasteButton
              textToCopy={event.metadata.voter}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <span className="text-secondary">
              (
              <span className="text-primary">
                {formatAmount(event.metadata.votingPower)} {tokenSymbol}
              </span>{" "}
              voting power)
            </span>{" "}
            <span className="text-secondary">voted</span>{" "}
            <CheckCircle2 className="text-success inline size-4 align-middle" />{" "}
            <span className="text-success font-medium capitalize">
              {event.metadata.support === "for"
                ? "Yes"
                : event.metadata.support === "against"
                  ? "No"
                  : "Abstain"}
            </span>{" "}
            <Link
              href={
                config?.governancePage
                  ? `/${daoId}/governance/proposal/${event.metadata.proposalId}`
                  : `https://tally.xyz/proposal/${event.metadata.proposalId}`
              }
              className="text-primary font-medium transition-colors"
            >
              {event.metadata.proposalId.slice(0, 6)}...
              {event.metadata.proposalId.slice(-4)}
            </Link>{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </p>
        );

      case FeedEventType.Proposal:
        if (!event.metadata) return null;
        return (
          <p className="leading-relaxed">
            <span className="inline-flex items-center gap-1.5 align-middle">
              <EnsAvatar
                address={event.metadata.proposer}
                showAvatar={true}
                size="xs"
                nameClassName="text-primary font-medium"
              />
            </span>{" "}
            <span className="text-secondary">
              (
              <span className="text-primary">
                {formatAmount(event.metadata.votingPower)} {tokenSymbol}
              </span>{" "}
              voting power)
            </span>{" "}
            <span className="text-secondary">created the proposal</span>{" "}
            <Link
              href={`/${daoId}/governance/proposal/${event.metadata.id}`}
              className="text-primary hover:text-link font-medium transition-colors"
            >
              {event.metadata.title}
            </Link>{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </p>
        );

      case FeedEventType.Transfer:
        if (!event.metadata) return null;
        return (
          <p className="leading-relaxed">
            <span className="inline-flex items-center gap-1.5 align-middle">
              <EnsAvatar
                address={event.metadata.from}
                showAvatar={true}
                size="xs"
                nameClassName="text-primary font-medium"
              />
            </span>{" "}
            <CopyAndPasteButton
              textToCopy={event.metadata.from}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <span className="text-secondary">transferred</span>{" "}
            <span className="text-primary font-medium">
              {formatAmount(event.metadata.amount)} {tokenSymbol}
            </span>{" "}
            <span className="text-secondary">to</span>{" "}
            <span className="inline-flex items-center gap-1.5 align-middle">
              <EnsAvatar
                address={event.metadata.to}
                showAvatar={true}
                size="xs"
                nameClassName="text-primary font-medium"
              />
            </span>{" "}
            <CopyAndPasteButton
              textToCopy={event.metadata.to}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </p>
        );

      case FeedEventType.Delegation: {
        if (!event.metadata) return null;
        const hasRedelegation = event.metadata.previousDelegate !== zeroAddress;

        return (
          <p className="leading-relaxed">
            <span className="inline-flex items-center gap-1.5 align-middle">
              <EnsAvatar
                address={event.metadata.delegator}
                showAvatar={true}
                size="xs"
                nameClassName="text-primary font-medium"
              />
              <CopyAndPasteButton
                textToCopy={event.metadata.delegator}
                className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
                iconSize="md"
              />
            </span>{" "}
            <span className="text-secondary">
              {hasRedelegation ? "redelegated" : "delegated"}
            </span>{" "}
            <span className="text-success font-medium">
              {formatAmount(event.metadata.amount)} {tokenSymbol}
            </span>{" "}
            {hasRedelegation && (
              <>
                <span className="text-secondary">from</span>{" "}
                <span className="inline-flex items-center gap-1.5 align-middle">
                  <EnsAvatar
                    address={event.metadata.previousDelegate!}
                    showAvatar={true}
                    size="xs"
                    nameClassName="text-primary font-medium"
                  />
                  <CopyAndPasteButton
                    textToCopy={event.metadata.previousDelegate!}
                    className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
                    iconSize="md"
                  />
                </span>{" "}
              </>
            )}
            <span className="text-secondary">to</span>{" "}
            <span className="inline-flex items-center gap-1.5 align-middle">
              <EnsAvatar
                address={event.metadata.delegate}
                showAvatar={true}
                size="xs"
                nameClassName="text-primary font-medium"
              />
            </span>{" "}
            <CopyAndPasteButton
              textToCopy={event.metadata.delegate}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </p>
        );
      }
      case FeedEventType.DelegationVotesChanged: {
        if (!event.metadata) return null;
        return (
          <p className="leading-relaxed">
            <span className="inline-flex items-center gap-1.5 align-middle">
              <EnsAvatar
                address={event.metadata.delegate}
                showAvatar={true}
                size="xs"
                nameClassName="text-primary font-medium"
              />
            </span>{" "}
            <CopyAndPasteButton
              textToCopy={event.metadata.delegate}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <span className="text-secondary">
              {BigInt(event.metadata.delta) > 0n ? "increased" : "decreased"}{" "}
              voting power
            </span>{" "}
            <span
              className={cn(
                "font-medium",
                BigInt(event.metadata.delta) > 0n
                  ? "text-success"
                  : "text-error",
              )}
            >
              {formatAmount(event.metadata.deltaMod)} {tokenSymbol}
            </span>{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </p>
        );
      }
    }
  };

  return (
    <div className={cn("flex items-stretch gap-4", className)}>
      {/* Badge and Connector */}
      <div className="flex flex-col items-center">
        <BadgeStatus
          variant={badgeVariant}
          icon={BadgeIcon}
          className="size-6 shrink-0"
          iconVariant={badgeVariant}
        />
        {!isLast && (
          <div className="mt-1 flex w-6 flex-1 justify-center">
            <DividerDefault isVertical className="h-14/15" />
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-1",
          isLast ? "pb-6" : "pb-8",
        )}
      >
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
