"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, Pencil, Trash2 } from "lucide-react";
import { erc20Abi } from "viem";
import { useReadContract } from "wagmi";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import type { ProposalAction } from "@/features/create-proposal/types";
import { BulletDivider } from "@/shared/components/design-system/section";
import { isAddressLike, toChecksumAddress } from "@/shared/utils/address";
import { cn } from "@/shared/utils/cn";

interface ActionRowProps {
  id: string;
  index: number;
  action: ProposalAction;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  error?: string;
}

function actionTypeLabel(action: ProposalAction): string {
  if (action.type === "eth-transfer" || action.type === "erc20-transfer")
    return "Transfer";
  return "Custom";
}

function truncateAddress(value: string): string {
  if (!isAddressLike(value)) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function actionSubtitle(action: ProposalAction, tokenSymbol?: string): string {
  if (action.type === "eth-transfer") return `${action.amount} ETH`;
  if (action.type === "erc20-transfer") {
    const label = tokenSymbol ?? "ERC-20";
    return `${action.amount} ${label}`;
  }
  return action.functionName;
}

function actionTarget(action: ProposalAction): string {
  if (action.type === "eth-transfer" || action.type === "erc20-transfer")
    return truncateAddress(action.recipient);
  return truncateAddress(action.contractAddress);
}

export const ActionRow = ({
  id,
  index,
  action,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDuplicate,
  onDelete,
  error,
}: ActionRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const erc20Address =
    action.type === "erc20-transfer" && isAddressLike(action.tokenAddress)
      ? toChecksumAddress(action.tokenAddress)
      : undefined;
  const { data: tokenSymbol } = useReadContract({
    abi: erc20Abi,
    address: erc20Address,
    functionName: "symbol",
    query: { enabled: Boolean(erc20Address) },
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "border-border-default bg-surface-default flex flex-col px-3 py-2",
        error && "bg-error/5",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <IconButton
            icon={ArrowUp}
            variant="ghost"
            size="sm"
            aria-label="Move up"
            disabled={isFirst}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-0.5"
          />
          <IconButton
            icon={ArrowDown}
            variant="ghost"
            size="sm"
            aria-label="Move down"
            disabled={isLast}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-0.5"
          />
        </div>
        <BadgeStatus variant="outline" className="size-5 justify-center px-0">
          {index + 1}
        </BadgeStatus>
        <div className="flex min-w-0 flex-1 flex-col gap-1 lg:flex-row lg:items-center">
          <span className="text-primary truncate text-sm font-medium">
            {actionTypeLabel(action)}
          </span>
          <BulletDivider className="hidden lg:block" />
          <span className="text-secondary truncate text-sm">
            {actionSubtitle(action, tokenSymbol)}
          </span>
          <BulletDivider className="hidden lg:block" />
          <span className="text-secondary truncate text-sm">
            {actionTarget(action)}
          </span>
        </div>
        <Tooltip asChild disableMobileClick tooltipContent="Edit">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit action"
          >
            <Pencil className="size-4" />
          </Button>
        </Tooltip>
        {/* Named, because the copy glyph reads as "copy to clipboard" and
            invites repeat clicks that each add another action. */}
        <Tooltip asChild disableMobileClick tooltipContent="Duplicate">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Duplicate action"
          >
            <Copy className="size-4" />
          </Button>
        </Tooltip>
        <Tooltip asChild disableMobileClick tooltipContent="Delete">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete action"
          >
            <Trash2 className="size-4" />
          </Button>
        </Tooltip>
      </div>
      {error && (
        <span className="text-error pl-[4.25rem] text-xs">{error}</span>
      )}
    </div>
  );
};
