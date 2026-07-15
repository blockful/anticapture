"use client";

import { CodeBlock } from "@/shared/components/design-system/code-block/CodeBlock";
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
      <CodeBlock code={token} codeClassName="break-all" />
    </Modal>
  );
};
