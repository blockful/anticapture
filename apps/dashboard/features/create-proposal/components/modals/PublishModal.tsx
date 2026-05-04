"use client";

import { Hourglass, PenLine } from "lucide-react";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import {
  StepList,
  type StepState,
} from "@/shared/components/design-system/step-list";

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isReceiptLoading: boolean;
  txHash?: `0x${string}`;
  proposalTitle: string;
  actionsCount: number;
  votingPower: string;
}

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-2">
    <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
      {label}
    </span>
    <span className="text-primary text-sm leading-5">{children}</span>
  </div>
);

export const PublishModal = ({
  open,
  onOpenChange,
  isReceiptLoading,
  txHash,
  proposalTitle,
  actionsCount,
  votingPower,
}: PublishModalProps) => {
  const walletState: StepState = txHash ? "done" : "active";
  const receiptState: StepState = !txHash
    ? "pending"
    : isReceiptLoading
      ? "active"
      : "done";

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Let's Publish It">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <DetailRow label="Proposal details">
            <span className="flex flex-col gap-0.5">
              <span className="text-primary text-sm leading-5">
                {proposalTitle || "Untitled proposal"}
              </span>
              <span className="text-secondary text-xs leading-5">
                {actionsCount} {actionsCount === 1 ? "action" : "actions"}
                {" · "}Onchain proposal
              </span>
            </span>
          </DetailRow>
          <DetailRow label="Your voting power">{votingPower}</DetailRow>
        </div>

        <StepList
          steps={[
            {
              state: walletState,
              icon: <PenLine className="text-inverted size-3.5" />,
              label: "Confirm your vote in your wallet",
            },
            {
              state: receiptState,
              icon: <Hourglass className="text-secondary size-3.5" />,
              label: "Wait for vote submission to complete",
            },
          ]}
        />

        <InlineAlert
          variant="warning"
          text="Once submitted, this proposal cannot be edited or deleted. Make sure everything is correct before publishing."
        />
      </div>
    </Modal>
  );
};
