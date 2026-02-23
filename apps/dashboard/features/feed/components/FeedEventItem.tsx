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
import Link from "next/link";
import { useParams } from "next/navigation";
import { Address, formatUnits, zeroAddress } from "viem";

import {
  FeedEvent,
  FeedEventRelevance,
  FeedEventType,
} from "@/features/feed/types";
import { EntityType } from "@/features/holders-and-delegates/components/HoldersAndDelegatesDrawer";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { BulletDivider } from "@/shared/components/design-system/section";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn, formatNumberUserReadable } from "@/shared/utils";

interface FeedEventItemProps {
  event: FeedEvent;
  className?: string;
  isLast?: boolean;
  onRowClick?: (address: string, entityType: EntityType) => void;
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

const AddressButton = ({
  address,
  entityType,
  onRowClick,
}: {
  address: Address;
  entityType: EntityType;
  onRowClick?: (address: string, entityType: EntityType) => void;
}) => (
  <button
    className="group inline-flex cursor-pointer items-center gap-1.5 align-middle"
    onClick={() => onRowClick?.(address, entityType)}
  >
    <EnsAvatar
      address={address}
      showAvatar={true}
      size="xs"
      isDashed={true}
      nameClassName="text-primary font-medium group-hover:border-primary transition-colors duration-200"
    />
  </button>
);

export const FeedEventItem = ({
  event,
  className,
  isLast = false,
  onRowClick,
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
          <div className="leading-relaxed">
            <AddressButton
              address={event.metadata.voter}
              entityType="delegate"
              onRowClick={onRowClick}
            />{" "}
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
            <span
              className={cn(
                event.metadata.support === 1
                  ? "text-success"
                  : event.metadata.support === 0
                    ? "text-error"
                    : "text-warning",
              )}
            >
              <CheckCircle2 className="inline size-4 align-middle" />{" "}
              <span className="font-medium capitalize">
                {event.metadata.support === 1
                  ? "Yes"
                  : event.metadata.support === 0
                    ? "No"
                    : "Abstain"}
              </span>{" "}
            </span>
            <span className="text-secondary">on proposal</span>{" "}
            <Link
              href={
                config?.governancePage
                  ? `/${daoId}/governance/proposal/${event.metadata.proposalId}`
                  : `${config?.daoOverview?.govPlatform?.url ?? ""}${event.metadata.proposalId}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium transition-colors"
            >
              {event.metadata.proposalId.length > 10
                ? `${event.metadata.proposalId.slice(0, 6)}...${event.metadata.proposalId.slice(-4)}`
                : event.metadata.proposalId}
            </Link>{" "}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="ml-1 inline-flex p-1 align-middle"
            >
              <Link
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        );

      case FeedEventType.Proposal:
        if (!event.metadata) return null;
        return (
          <div className="leading-relaxed">
            <AddressButton
              address={event.metadata.proposer}
              entityType="delegate"
              onRowClick={onRowClick}
            />{" "}
            <span className="text-secondary">
              (
              <span className="text-primary">
                {formatAmount(event.metadata.votingPower)} {tokenSymbol}
              </span>{" "}
              voting power)
            </span>{" "}
            <span className="text-secondary">created the proposal</span>{" "}
            <Link
              href={
                config?.governancePage
                  ? `/${daoId}/governance/proposal/${event.metadata.id}`
                  : `${config?.daoOverview?.govPlatform?.url ?? ""}${event.metadata.id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-link font-medium transition-colors"
            >
              {event.metadata.title}
            </Link>{" "}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="ml-1 inline-flex p-1 align-middle"
            >
              <Link
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        );

      case FeedEventType.ProposalExtended:
        if (!event.metadata) return null;
        return (
          <div className="leading-relaxed">
            <span className="text-secondary">
              Proposal{" "}
              <Link
                href={
                  config?.governancePage
                    ? `/${daoId}/governance/proposal/${event.metadata.id}`
                    : `${config?.daoOverview?.govPlatform?.url ?? ""}${event.metadata.id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-link font-medium transition-colors"
              >
                {event.metadata.title}
              </Link>{" "}
              extended to {formatTime(Number(event.metadata.endTimestamp))}
            </span>{" "}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="ml-1 inline-flex p-1 align-middle"
            >
              <Link
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        );

      case FeedEventType.Transfer:
        if (!event.metadata) return null;
        return (
          <div className="leading-relaxed">
            <AddressButton
              address={event.metadata.from}
              entityType="tokenHolder"
              onRowClick={onRowClick}
            />{" "}
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
            <AddressButton
              address={event.metadata.to}
              entityType="tokenHolder"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={event.metadata.to}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="ml-1 inline-flex p-1 align-middle"
            >
              <Link
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        );

      case FeedEventType.Delegation: {
        if (!event.metadata) return null;
        const hasRedelegation =
          event.metadata.previousDelegate !== null &&
          event.metadata.previousDelegate !== zeroAddress;

        return (
          <div className="leading-relaxed">
            <AddressButton
              address={event.metadata.delegator}
              entityType="tokenHolder"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={event.metadata.delegator}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <span className="text-secondary">
              {hasRedelegation ? "redelegated" : "delegated"}
            </span>{" "}
            <span className="text-success font-medium">
              {formatAmount(event.metadata.amount)} {tokenSymbol}
            </span>{" "}
            {hasRedelegation && (
              <>
                <span className="text-secondary">from</span>{" "}
                <AddressButton
                  address={event.metadata.previousDelegate!}
                  entityType="delegate"
                  onRowClick={onRowClick}
                />{" "}
                <CopyAndPasteButton
                  textToCopy={event.metadata.previousDelegate!}
                  className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
                  iconSize="md"
                />{" "}
              </>
            )}
            <span className="text-secondary">to</span>{" "}
            <AddressButton
              address={event.metadata.delegate}
              entityType="delegate"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={event.metadata.delegate}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="ml-1 inline-flex p-1 align-middle"
            >
              <Link
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        );
      }
      case FeedEventType.DelegationVotesChanged: {
        if (!event.metadata) return null;
        return (
          <div className="leading-relaxed">
            <AddressButton
              address={event.metadata.delegate}
              entityType="delegate"
              onRowClick={onRowClick}
            />{" "}
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
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="ml-1 inline-flex p-1 align-middle"
            >
              <Link
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
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
