"use client";

import { formatDistanceToNow } from "date-fns";
import { Link2, Pencil, Trash2 } from "lucide-react";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import type { ProposalDraft } from "@/features/create-proposal/types";

interface DraftCardProps {
  draft: ProposalDraft;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

export const DraftCard = ({
  draft,
  onEdit,
  onDelete,
  onShare,
}: DraftCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onEdit(draft.id)}
    onKeyDown={(e) => {
      // Only react to the card itself; Enter/Space on a nested action button
      // (Copy Link / Edit / Delete) must not also trigger the row's edit.
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") onEdit(draft.id);
    }}
    className="border-border-default bg-surface-default rounded-base flex cursor-pointer flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-primary truncate text-sm font-medium">
          {draft.title || "Untitled draft"}
        </span>
        <BadgeStatus variant="outline">Draft</BadgeStatus>
      </div>
      <span className="text-secondary text-xs">
        Draft • {formatDistanceToNow(draft.updatedAt, { addSuffix: true })}
      </span>
    </div>
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      <Button variant="outline" onClick={() => onShare(draft.id)}>
        <Link2 className="size-4" />
        Copy Link
      </Button>
      <Tooltip asChild disableMobileClick tooltipContent="Edit">
        <Button
          variant="outline"
          onClick={() => onEdit(draft.id)}
          aria-label="Edit draft"
          className="aspect-square px-0"
        >
          <Pencil className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip asChild disableMobileClick tooltipContent="Delete">
        <Button
          variant="outline"
          onClick={() => onDelete(draft.id)}
          aria-label="Delete draft"
          className="aspect-square px-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </Tooltip>
    </div>
  </div>
);
