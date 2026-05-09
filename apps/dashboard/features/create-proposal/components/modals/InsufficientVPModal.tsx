"use client";

import { XCircle } from "lucide-react";

import { Modal } from "@/shared/components/design-system/modal/Modal";
import { formatNumberUserReadable } from "@/shared/utils";

interface InsufficientVPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVp: string;
  requiredVp: string;
  onFindDelegate: () => void;
  onViewDraft: () => void;
}

export const InsufficientVPModal = ({
  open,
  onOpenChange,
  currentVp,
  requiredVp,
  onFindDelegate,
  onViewDraft,
}: InsufficientVPModalProps) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title="Insufficient voting power"
    cancelLabel="View my draft"
    confirmLabel="Find a delegate"
    onCancel={onViewDraft}
    onConfirm={onFindDelegate}
  >
    <div className="flex flex-col items-center gap-3 py-4">
      <XCircle className="text-warning size-16" />
      <h3 className="text-primary text-center text-lg font-medium">
        Insufficient voting power
      </h3>
      <p className="text-secondary max-w-sm text-center text-sm leading-5">
        You don&apos;t have enough voting power to submit this proposal
        on-chain. Your proposal has been saved as a draft — share it with
        someone who has enough voting power to submit it on your behalf.
      </p>
      <div className="border-border-default rounded-base mt-2 flex w-full flex-col gap-2 border p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-secondary">Required</span>
          <span className="text-primary font-medium">
            {formatNumberUserReadable(Number(requiredVp), 1)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-secondary">Yours</span>
          <span className="text-warning font-medium">
            {formatNumberUserReadable(Number(currentVp), 1)}
          </span>
        </div>
      </div>
    </div>
  </Modal>
);
