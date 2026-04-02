"use client";

import {
  FileText,
  ExternalLink,
  CheckCircle2,
  ArrowLeftRight,
  Inbox,
  HeartHandshake,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { Address } from "viem";
import { formatUnits, zeroAddress } from "viem";

import type {
  DelegationDetail,
  FeedEvent,
  ProposalDetail,
  ProposalExtendedDetail,
  TransferDetail,
  VoteDetail,
} from "@/features/feed/types";
import { FeedEventRelevance, FeedEventType } from "@/features/feed/types";
import type { EntityType } from "@/features/holders-and-delegates/components/HoldersAndDelegatesDrawer";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BadgeStatus } from "@/shared/components/design-system/badges";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { BulletDivider } from "@/shared/components/design-system/section";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { getDaoProposalPath } from "@/shared/utils/whitelabel";

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
  const pathname = usePathname();
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
      case FeedEventType.Vote: {
        const voteMetadata = event.metadata as VoteDetail | undefined;
        if (!voteMetadata) return null;
        return (
          <div className="leading-relaxed">
            <AddressButton
              address={voteMetadata.voter}
              entityType="delegate"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={voteMetadata.voter}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <span className="text-secondary">
              (
              <span className="text-primary">
                {formatAmount(voteMetadata.votingPower)} {tokenSymbol}
              </span>{" "}
              voting power)
            </span>{" "}
            <span className="text-secondary">voted</span>{" "}
            <span
              className={cn(
                voteMetadata.support === 1
                  ? "text-success"
                  : voteMetadata.support === 0
                    ? "text-error"
                    : "text-warning",
              )}
            >
              <CheckCircle2 className="inline size-4 align-middle" />{" "}
              <span className="font-medium capitalize">
                {voteMetadata.support === 1
                  ? "Yes"
                  : voteMetadata.support === 0
                    ? "No"
                    : "Abstain"}
              </span>{" "}
            </span>
            <span className="text-secondary">on proposal</span>{" "}
            <Link
              href={
                config?.governancePage
                  ? getDaoProposalPath({
                      daoId: daoId.toUpperCase() as DaoIdEnum,
                      pathname,
                      proposalId: voteMetadata.proposalId,
                    })
                  : `${config?.daoOverview?.govPlatform?.url ?? ""}${voteMetadata.proposalId}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-link font-medium transition-colors"
            >
              {voteMetadata.title ||
                (voteMetadata.proposalId.length > 10
                  ? `${voteMetadata.proposalId.slice(0, 6)}...${voteMetadata.proposalId.slice(-4)}`
                  : voteMetadata.proposalId)}
            </Link>{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        );
      }

      case FeedEventType.Proposal: {
        const proposalMetadata = event.metadata as ProposalDetail | undefined;
        if (!proposalMetadata) return null;
        return (
          <div className="leading-relaxed">
            <AddressButton
              address={proposalMetadata.proposer}
              entityType="delegate"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={proposalMetadata.proposer}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <span className="text-secondary">
              (
              <span className="text-primary">
                {formatAmount(proposalMetadata.votingPower)} {tokenSymbol}
              </span>{" "}
              voting power)
            </span>{" "}
            <span className="text-secondary">created the proposal</span>{" "}
            <Link
              href={
                config?.governancePage
                  ? getDaoProposalPath({
                      daoId: daoId.toUpperCase() as DaoIdEnum,
                      pathname,
                      proposalId: proposalMetadata.id,
                    })
                  : `${config?.daoOverview?.govPlatform?.url ?? ""}${proposalMetadata.id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-link font-medium transition-colors"
            >
              {proposalMetadata.title}
            </Link>{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        );
      }

      case FeedEventType.ProposalExtended: {
        const proposalExtendedMetadata = event.metadata as
          | ProposalExtendedDetail
          | undefined;
        if (!proposalExtendedMetadata) return null;
        return (
          <div className="leading-relaxed">
            <span className="text-secondary">
              Proposal{" "}
              <Link
                href={
                  config?.governancePage
                    ? getDaoProposalPath({
                        daoId: daoId.toUpperCase() as DaoIdEnum,
                        pathname,
                        proposalId: proposalExtendedMetadata.id,
                      })
                    : `${config?.daoOverview?.govPlatform?.url ?? ""}${proposalExtendedMetadata.id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-link font-medium transition-colors"
              >
                {proposalExtendedMetadata.title}
              </Link>{" "}
              extended to{" "}
              {formatTime(Number(proposalExtendedMetadata.endTimestamp))}
            </span>{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        );
      }

      case FeedEventType.Transfer: {
        const transferMetadata = event.metadata as TransferDetail | undefined;
        if (!transferMetadata) return null;
        return (
          <div className="leading-relaxed">
            <AddressButton
              address={transferMetadata.from}
              entityType="tokenHolder"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={transferMetadata.from}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <span className="text-secondary">transferred</span>{" "}
            <span className="text-primary font-medium">
              {formatAmount(transferMetadata.amount)} {tokenSymbol}
            </span>{" "}
            <span className="text-secondary">to</span>{" "}
            <AddressButton
              address={transferMetadata.to}
              entityType="tokenHolder"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={transferMetadata.to}
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
          </div>
        );
      }

      case FeedEventType.Delegation: {
        const delegationMetadata = event.metadata as
          | DelegationDetail
          | undefined;
        if (!delegationMetadata) return null;
        const hasRedelegation =
          delegationMetadata.previousDelegate !== null &&
          delegationMetadata.previousDelegate !== zeroAddress;

        return (
          <div className="leading-relaxed">
            <AddressButton
              address={delegationMetadata.delegator}
              entityType="tokenHolder"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={delegationMetadata.delegator}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <span className="text-secondary">
              {hasRedelegation ? "redelegated" : "delegated"}
            </span>{" "}
            <span className="text-success font-medium">
              {formatAmount(delegationMetadata.amount)} {tokenSymbol}
            </span>{" "}
            {hasRedelegation && (
              <>
                <span className="text-secondary">from</span>{" "}
                <AddressButton
                  address={delegationMetadata.previousDelegate!}
                  entityType="delegate"
                  onRowClick={onRowClick}
                />{" "}
                <CopyAndPasteButton
                  textToCopy={delegationMetadata.previousDelegate!}
                  className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
                  iconSize="md"
                />{" "}
              </>
            )}
            <span className="text-secondary">to</span>{" "}
            <AddressButton
              address={delegationMetadata.delegate}
              entityType="delegate"
              onRowClick={onRowClick}
            />{" "}
            <CopyAndPasteButton
              textToCopy={delegationMetadata.delegate}
              className="text-secondary hover:text-primary inline-flex p-1 align-middle transition-colors"
              iconSize="md"
            />{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary inline-flex align-middle transition-colors"
            >
              <Link
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </a>
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
