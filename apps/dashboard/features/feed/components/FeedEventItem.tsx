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

import {
  type FeedItem,
  type FeedRelevance,
  type FeedEventType,
} from "@anticapture/client";
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
import type {
  DelegationDetail,
  ProposalDetail,
  ProposalExtendedDetail,
  TransferDetail,
  VoteDetail,
} from "@/features/feed/types";

interface FeedEventItemProps {
  event: FeedItem;
  className?: string;
  isLast?: boolean;
  onRowClick?: (address: string, entityType: EntityType) => void;
}

const getBadgeIcon = (type: FeedEventType) => {
  switch (type) {
    case "VOTE":
      return Inbox;
    case "PROPOSAL":
      return FileText;
    case "TRANSFER":
      return ArrowLeftRight;
    case "DELEGATION":
      return HeartHandshake;
    case "PROPOSAL_EXTENDED":
      return Clock;
  }
};

const getBadgeVariant = (relevance: FeedRelevance) => {
  switch (relevance) {
    case "HIGH":
      return "error";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "success";
    default:
      return "secondary";
  }
};

const getRelevanceLabel = (relevance: FeedRelevance) => {
  switch (relevance) {
    case "HIGH":
      return "High Relevance";
    case "MEDIUM":
      return "Medium Relevance";
    case "LOW":
      return "Low Relevance";
    default:
      return "No Relevance";
  }
};

const getRelevanceColor = (relevance: FeedRelevance) => {
  switch (relevance) {
    case "HIGH":
      return "text-error";
    case "MEDIUM":
      return "text-warning";
    case "LOW":
      return "text-success";
    default:
      return "text-secondary";
  }
};

const getEventTypeLabel = (type: FeedEventType) => {
  switch (type) {
    case "VOTE":
      return "Vote";
    case "PROPOSAL":
      return "Proposal Creation";
    case "TRANSFER":
      return "Transfer";
    case "DELEGATION":
      return "Delegation";
    case "PROPOSAL_EXTENDED":
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
      case "VOTE": {
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

      case "PROPOSAL": {
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

      case "PROPOSAL_EXTENDED": {
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

      case "TRANSFER": {
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

      case "DELEGATION": {
        const delegationMetadata = event.metadata as DelegationDetail | null;
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
    <div className={cn("ml-5 flex items-stretch gap-4", className)}>
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
