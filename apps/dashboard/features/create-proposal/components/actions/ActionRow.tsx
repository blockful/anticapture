"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { erc20Abi, isAddress } from "viem";
import { useReadContract } from "wagmi";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import type { ProposalAction } from "@/features/create-proposal/types";
import { BulletDivider } from "@/shared/components/design-system/section";

interface ActionRowProps {
  id: string;
  index: number;
  action: ProposalAction;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function actionTypeLabel(action: ProposalAction): string {
  if (action.type === "eth-transfer" || action.type === "erc20-transfer")
    return "Transfer";
  return "Custom";
}

/** Shortens a 0x address to the conventional 0xabcd…1234 form. Pass through
 *  any value that isn't a hex address (e.g. an ENS name) unchanged. */
function truncateAddress(value: string): string {
  if (!isAddress(value)) return value;
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
  onDelete,
}: ActionRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Resolve the ERC-20 symbol at render-time so the summary shows e.g.
  // "100 USDC" instead of "100 ERC-20". We only read when the address looks
  // valid so wagmi doesn't fire requests for in-progress input.
  const erc20Address =
    action.type === "erc20-transfer" && isAddress(action.tokenAddress)
      ? (action.tokenAddress as `0x${string}`)
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
      className="border-border-default bg-surface-default flex items-center gap-2 px-3 py-2"
    >
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
    </div>
  );
};
