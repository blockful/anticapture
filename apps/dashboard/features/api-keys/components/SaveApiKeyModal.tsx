"use client";

import { CodeBlock } from "@/shared/components/design-system/code-block/CodeBlock";
import { Modal } from "@/shared/components/design-system/modal/Modal";

import { ConnectAgentSection } from "./ConnectAgentSection";

/**
 * Shown once, right after a key is created: the plaintext is never retrievable
 * again, so the user can save it or connect an agent before deliberately
 * confirming that they are done.
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
      description={`This is the only time "${label}" is shown. Save it or connect your AI agent now — you can't retrieve it again.`}
      confirmLabel="I've saved it"
      onConfirm={() => onOpenChange(false)}
      className="max-w-3xl"
      bodyClassName="max-h-[70vh] overflow-y-auto"
    >
      <div className="flex flex-col gap-6">
        <CodeBlock code={token} codeClassName="break-all" />
        <ConnectAgentSection
          keys={[]}
          sessionTokens={{ created: token }}
          lastCreated={{ id: "created", label }}
        />
      </div>
    </Modal>
  );
};
