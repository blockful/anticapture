"use client";

import { useState } from "react";

import { Button } from "@/shared/components";
import { Modal } from "@/shared/components/design-system/modal/Modal";

/**
 * Shown once, right after a key is created: the plaintext is never retrievable
 * again, so the copy affordance is prominent and closing is a deliberate
 * confirm ("I've saved it").
 */
export const SaveApiKeyModal = ({
  open,
  onOpenChange,
  token,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  label: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Save your API key"
      description={`This is the only time "${label}" is shown. Copy it now — you can't retrieve it again.`}
      confirmLabel="Done"
      onConfirm={() => onOpenChange(false)}
    >
      {/* The modal body brings its own padding. */}
      <div className="border-border-contrast bg-surface-default relative border p-3">
        <code className="text-secondary block min-w-0 break-all pr-16 font-mono text-sm">
          {token}
        </code>
        {/* Pinned flush to the block's corner like the gov frontend's
            Encode button; nudged -1px so its border overlaps the box's
            instead of stacking beside it. */}
        <Button
          variant="outline"
          size="sm"
          className="absolute -bottom-px -right-px"
          onClick={copy}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Modal>
  );
};
