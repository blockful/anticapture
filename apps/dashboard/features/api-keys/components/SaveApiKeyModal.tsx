"use client";

import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
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
        <code className="text-secondary block min-w-0 break-all pr-8 font-mono text-sm">
          {token}
        </code>
        <CopyAndPasteButton
          textToCopy={token}
          className="absolute bottom-0 right-0"
        />
      </div>
    </Modal>
  );
};
