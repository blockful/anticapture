"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Modal } from "@/shared/components/design-system/modal/Modal";
import { cn } from "@/shared/utils/cn";

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
        <div className="border-border-contrast bg-surface-default flex items-start gap-2.5 rounded-md border p-3">
          <code className="text-secondary min-w-0 flex-1 break-all font-mono text-sm">
            {token}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy API key"
            className={cn(
              "text-secondary hover:text-primary shrink-0 transition-colors",
            )}
          >
            {copied ? (
              <Check className="text-success size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
