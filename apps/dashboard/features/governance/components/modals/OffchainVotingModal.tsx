"use client";

import type { GetOffchainProposalQuery } from "@anticapture/graphql-client/hooks";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { ApprovalVoteOptions } from "@/features/governance/components/modals/vote-options/ApprovalVoteOptions";
import { BasicVoteOptions } from "@/features/governance/components/modals/vote-options/BasicVoteOptions";
import { QuadraticVoteOptions } from "@/features/governance/components/modals/vote-options/QuadraticVoteOptions";
import { RankedChoiceOptions } from "@/features/governance/components/modals/vote-options/RankedChoiceOptions";
import { SingleChoiceOptions } from "@/features/governance/components/modals/vote-options/SingleChoiceOptions";
import { WeightedVoteOptions } from "@/features/governance/components/modals/vote-options/WeightedVoteOptions";
import { useOffchainVotingPower } from "@/features/governance/hooks/useOffchainVotingPower";
import { useVoteOnOffchainProposal } from "@/features/governance/hooks/useVoteOnOffchainProposal";
import { normalizeChoices } from "@/features/governance/utils/offchainProposal";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import { Button } from "@/shared/components";
import { formatNumberUserReadable } from "@/shared/utils";

type VoteChoice = number | number[] | Record<string, number>;

type OffchainProposalData = Extract<
  NonNullable<GetOffchainProposalQuery["offchainProposalById"]>,
  { __typename?: "OffchainProposal" }
>;

interface OffchainVotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: OffchainProposalData;
}

export const OffchainVotingModal = ({
  isOpen,
  onClose,
  proposal,
}: OffchainVotingModalProps) => {
  const [value, setValue] = useState<VoteChoice | null>(null);
  const [comment, setComment] = useState<string>("");

  const { address } = useAccount();
  const { vote, isPending: isVoting } = useVoteOnOffchainProposal();
  const strategies = useMemo(
    () =>
      proposal.strategies
        ?.filter((s): s is NonNullable<typeof s> => s !== null)
        .map((s) => ({
          name: s.name,
          network: s.network,
          params:
            typeof s.params === "string" ? JSON.parse(s.params) : s.params,
        })),
    [proposal.strategies],
  );
  const {
    votingPower,
    isLoading: isVpLoading,
    error: vpError,
  } = useOffchainVotingPower({
    address,
    spaceId: proposal.spaceId,
    proposalId: proposal.id,
    snapshot: proposal.snapshot,
    strategies,
    network: proposal.network,
  });

  const choices = normalizeChoices(proposal.choices);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setValue(null);
      setComment("");
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

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

  const isVoteEnabled = (() => {
    if (!value || !address || isVoting) return false;
    if (proposal.type === "approval") return (value as number[]).length > 0;
    if (proposal.type === "weighted") {
      const total = Object.values(value as Record<string, number>).reduce(
        (a, b) => a + b,
        0,
      );
      return total === 100;
    }
    if (proposal.type === "quadratic") {
      const total = Object.values(value as Record<string, number>).reduce(
        (a, b) => a + b,
        0,
      );
      return total > 0;
    }
    return true;
  })();

  const handleVote = async () => {
    if (!address || !value) return;
    try {
      await vote({
        spaceId: proposal.spaceId,
        proposalId: proposal.id,
        type: proposal.type as
          | "basic"
          | "single-choice"
          | "approval"
          | "ranked-choice"
          | "weighted"
          | "quadratic",
        choice: value,
        reason: comment,
      });
      showCustomToast("Vote submitted successfully!", "success");
      onClose();
      window.location.reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit vote";
      showCustomToast(message, "error");
    }
  };

  const renderVoteOptions = () => {
    switch (proposal.type) {
      case "basic":
        return (
          <BasicVoteOptions
            choices={choices}
            value={value as number | null}
            onChange={setValue}
          />
        );
      case "single-choice":
        return (
          <SingleChoiceOptions
            choices={choices}
            value={value as number | null}
            onChange={setValue}
          />
        );
      case "approval":
        return (
          <ApprovalVoteOptions
            choices={choices}
            value={value as number[] | null}
            onChange={setValue}
          />
        );
      case "ranked-choice":
        return (
          // key forces remount on each modal open, resetting internal ranked state
          <RankedChoiceOptions
            key={String(isOpen)}
            choices={choices}
            value={value as number[] | null}
            onChange={setValue}
          />
        );
      case "weighted":
        return (
          <WeightedVoteOptions
            choices={choices}
            value={value as Record<string, number> | null}
            onChange={setValue}
          />
        );
      case "quadratic":
        return (
          <QuadraticVoteOptions
            choices={choices}
            value={value as Record<string, number> | null}
            onChange={setValue}
            maxTotal={votingPower}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors ${
        isOpen ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={`border-border-default bg-surface-default relative z-10 mx-4 w-full max-w-[600px] border shadow-lg transition-all duration-200 ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
      >
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

        {/* Voting Power */}
        <div className="flex flex-col gap-[6px] p-4">
          <p className="font-inter text-primary text-[12px] font-medium">
            Your voting power
          </p>
          {isVpLoading && (
            <p className="text-secondary text-[14px]">Loading...</p>
          )}
          {!isVpLoading && vpError && (
            <p className="text-secondary text-[14px]">
              Unable to fetch voting power
            </p>
          )}
          {!isVpLoading && !vpError && (
            <p className="text-primary text-[14px]">
              {formatNumberUserReadable(votingPower)}
            </p>
          )}
        </div>

        {/* Vote options */}
        <div className="flex flex-col gap-[6px] p-4">
          <p className="font-inter text-primary text-[12px] font-medium">
            Your vote
          </p>
          {renderVoteOptions()}
        </div>

        {/* Comment */}
        <div className="flex flex-col gap-[6px] p-4">
          <p className="font-inter text-primary text-[12px] font-medium not-italic leading-4">
            Comment <span className="text-secondary">(optional)</span>
          </p>
          <textarea
            className="border-border-default text-primary flex h-[100px] w-full items-start gap-2.5 self-stretch rounded-md border bg-transparent px-2.5 py-2 text-[14px] focus:outline-none"
            placeholder="Enter your comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="border-border-default flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            data-ph-event="vote_offchain_submit"
            data-ph-source="gov_fe"
            data-umami-event="vote_offchain_submit"
            disabled={!isVoteEnabled}
            loading={isVoting}
            onClick={handleVote}
          >
            Vote
          </Button>
        </div>
      </div>
    </div>
  );
};
