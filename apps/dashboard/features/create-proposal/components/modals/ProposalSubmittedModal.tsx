"use client";

import { CheckCircle2 } from "lucide-react";

import { Modal } from "@/shared/components/design-system/modal/Modal";

interface ProposalSubmittedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewProposal: () => void;
  proposalId: string | null;
}

export const ProposalSubmittedModal = ({
  open,
  onOpenChange,
  onViewProposal,
  proposalId,
}: ProposalSubmittedModalProps) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title="Proposal submitted"
    cancelLabel="Close"
    confirmLabel="View proposal"
    onCancel={() => onOpenChange(false)}
    onConfirm={onViewProposal}
    isConfirmDisabled={!proposalId}
  >
    <div className="flex flex-col items-center gap-3 py-4">
      <CheckCircle2 className="text-success size-16" />

      <h3 className="text-primary text-center text-lg font-medium">
        Proposal submitted successfully!
      </h3>
      <p className="text-secondary max-w-sm text-center text-sm leading-5">
        Your proposal has been submitted on-chain and is now visible to
        everyone. Voting will begin shortly.
      </p>
    </div>
  </Modal>
);
