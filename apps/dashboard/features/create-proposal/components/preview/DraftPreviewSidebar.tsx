"use client";

import { Link2, Pencil, Rocket } from "lucide-react";
import type { Address } from "viem";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";

interface DraftPreviewSidebarProps {
  title: string;
  authorAddress: string;
  helperCopy: string;
  /** Author sees Copy Link; recipient sees Edit. */
  secondaryAction: "copy-link" | "edit";
  onPublish: () => void;
  onCopyLink: () => void;
  onEdit: () => void;
  publishDisabled?: boolean;
}

export const DraftPreviewSidebar = ({
  title,
  authorAddress,
  helperCopy,
  secondaryAction,
  onPublish,
  onCopyLink,
  onEdit,
  publishDisabled = false,
}: DraftPreviewSidebarProps) => (
  <div className="flex w-full flex-col gap-4">
    <span className="text-secondary flex items-center gap-1 text-sm">
      Draft •
      <EnsAvatar
        size="xs"
        address={authorAddress as Address}
        nameClassName="text-secondary"
      />
    </span>

    <h4 className="text-primary text-xl">{title}</h4>

    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="md"
        disabled={publishDisabled}
        onClick={onPublish}
      >
        <Rocket className="size-4" />
        Publish
      </Button>
      {secondaryAction === "copy-link" ? (
        <Button variant="outline" size="md" onClick={onCopyLink}>
          <Link2 className="size-4" />
          Copy Link
        </Button>
      ) : (
        <Button variant="outline" size="md" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
      )}
    </div>

    <p className="text-secondary text-sm leading-5">{helperCopy}</p>
  </div>
);
