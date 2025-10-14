"use client";

import { Button } from "@/shared/components";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Query_Proposals_Items_Items;
}

export const VotingModal = ({
  isOpen,
  onClose,
  proposal,
}: VotingModalProps) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="border-border-default bg-surface-default relative z-10 mx-4 w-full max-w-[600px] rounded-lg border shadow-lg">
        {/* Header */}
        <div className="border-border-default mb-4 flex items-start justify-between border-b px-4 py-3">
          <div className="flex flex-col items-start">
            <h2 className="text-primary font-inter text-[16px] font-medium not-italic leading-6">
              Cast Your Vote
            </h2>
            <p className="text-secondary font-inter text-[14px] font-normal not-italic leading-5">
              Once you submit your vote, you cannot change it.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-secondary hover:text-primary cursor-pointer rounded-sm p-1 transition-colors"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-primary overflow-hidden p-4">
          <div className="bg-surface-contrast flex flex-col overflow-hidden rounded-lg">
            <div className="border-border-contrast flex flex-col items-start gap-2 border-b p-3">
              <ProposalInfoItem label="Proposal ID" value={proposal?.id} />
              <ProposalInfoItem
                label="Proposal name"
                value={proposal?.title || "Untitled"}
              />
              <ProposalInfoItem
                label="Your voting power"
                value="0" // TODO: Get actual voting power
              />
            </div>

            <div className="px-3 py-2">
              <p className="text-secondary font-mono text-[12px] font-medium uppercase not-italic leading-4 tracking-[0.045em]">
                You can also vote through:
              </p>
            </div>
          </div>
        </div>

        <div className="border-border-default flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button>Submit</Button>
        </div>
      </div>
    </div>
  );
};

const ProposalInfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="flex w-full items-start gap-3">
      <div className="w-[116px] flex-shrink-0">
        <p className="font-inter text-secondary text-[12px] font-medium not-italic leading-4">
          {label}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-inter break-all text-[14px] font-normal not-italic leading-[20px]">
          {value}
        </p>
      </div>
    </div>
  );
};
