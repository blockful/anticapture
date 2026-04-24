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
}

export const InsufficientVPModal = ({
  open,
  onOpenChange,
  currentVp,
  requiredVp,
  onFindDelegate,
}: InsufficientVPModalProps) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title="Insufficient voting power"
    cancelLabel="Cancel"
    confirmLabel="Find a delegate"
    onCancel={() => onOpenChange(false)}
    onConfirm={onFindDelegate}
  >
    <div className="flex flex-col items-center gap-3 py-4">
      <XCircle className="text-warning size-16" />
      <h3 className="text-primary text-center text-lg font-medium">
        Insufficient voting power
      </h3>
      <p className="text-secondary max-w-sm text-center text-sm leading-5">
        You don't have enough voting power to create a proposal on ENS. Vote on
        active proposals, or delegate your tokens to someone who can propose on
        your behalf.
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
