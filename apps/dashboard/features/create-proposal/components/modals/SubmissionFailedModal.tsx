"use client";

import { XCircle } from "lucide-react";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Modal } from "@/shared/components/design-system/modal/Modal";

interface SubmissionFailedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTryAgain: () => void;
  errorMessage?: string;
}

export const SubmissionFailedModal = ({
  open,
  onOpenChange,
  onTryAgain,
  errorMessage,
}: SubmissionFailedModalProps) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title="Submission failed"
    cancelLabel="Cancel"
    confirmLabel="Try again"
    onCancel={() => onOpenChange(false)}
    onConfirm={onTryAgain}
  >
    <div className="flex flex-col items-center gap-3 py-4">
      <XCircle className="text-error size-16" />
      <h3 className="text-primary text-center text-lg font-medium">
        Transaction rejected
      </h3>
      <p className="text-secondary max-w-sm text-center text-sm leading-5">
        The transaction was rejected in your wallet, or the contract reverted.
        Your draft has been preserved.
      </p>
      {errorMessage && (
        <div className="w-full">
          <InlineAlert variant="error" text={errorMessage} />
        </div>
      )}
    </div>
  </Modal>
);
