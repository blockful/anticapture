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
      <div className="flex flex-col gap-2 p-4">
        <div className="border-border-contrast bg-surface-default flex items-start gap-2.5 border p-3">
          <code className="text-secondary min-w-0 flex-1 break-all font-mono text-sm">
            {token}
          </code>
          {/* Labeled like ConnectAgentSection's — this is the one-time
              reveal, where the copy affordance matters most. */}
          <Button
            variant="outline"
            size="sm"
            className="self-end"
            onClick={copy}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
