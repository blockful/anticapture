"use client";

import { useEffect, useState } from "react";

import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { Modal } from "@/shared/components/design-system/modal/Modal";

/**
 * Names a new key, then delegates the one-time plaintext reveal to the caller
 * (which opens SaveApiKeyModal). Keeps its own submitting state so double
 * confirms can't mint twice.
 */
export const CreateApiKeyModal = ({
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (label: string) => void;
  isCreating: boolean;
}) => {
  const [label, setLabel] = useState("");

  // Reset the field whenever the modal (re)opens.
  useEffect(() => {
    if (open) setLabel("");
  }, [open]);

  const trimmed = label.trim();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create API key"
      description="Give the key a name so you can recognize it later (e.g. the agent or machine that will use it)."
      confirmLabel="Create key"
      cancelLabel="Cancel"
      isConfirmDisabled={trimmed.length === 0}
      isConfirmLoading={isCreating}
      onConfirm={() => onCreate(trimmed)}
    >
      {/* The modal body brings its own padding. */}
      <div className="flex flex-col gap-2">
        <FormLabel htmlFor="api-key-label" isRequired>
          Name your key
        </FormLabel>
        <Input
          id="api-key-label"
          value={label}
          maxLength={100}
          placeholder="e.g. my-claude-agent"
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
    </Modal>
  );
};
