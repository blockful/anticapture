"use client";

import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import type { ProposalDraft } from "@/features/create-proposal/types";

interface DraftCardProps {
  draft: ProposalDraft;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DraftCard = ({ draft, onEdit, onDelete }: DraftCardProps) => (
  <div className="border-border-default bg-surface-default rounded-base flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-primary truncate text-sm font-medium">
          {draft.title || "Untitled draft"}
        </span>
        <BadgeStatus variant="outline">Draft</BadgeStatus>
      </div>
      <span className="text-secondary text-xs">
        Updated {formatDistanceToNow(draft.updatedAt, { addSuffix: true })}
      </span>
    </div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(draft.id)}
        className="flex-1 sm:flex-none"
      >
        <Pencil className="size-4" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(draft.id)}
        className="flex-1 sm:flex-none"
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
    </div>
  </div>
);
