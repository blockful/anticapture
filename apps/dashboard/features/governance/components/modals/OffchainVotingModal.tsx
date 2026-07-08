"use client";

import type { OffchainProposal } from "@anticapture/client";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { ApprovalVoteOptions } from "@/features/governance/components/modals/vote-options/ApprovalVoteOptions";
import { BasicVoteOptions } from "@/features/governance/components/modals/vote-options/BasicVoteOptions";
import { QuadraticVoteOptions } from "@/features/governance/components/modals/vote-options/QuadraticVoteOptions";
import { RankedChoiceOptions } from "@/features/governance/components/modals/vote-options/RankedChoiceOptions";
import { SingleChoiceOptions } from "@/features/governance/components/modals/vote-options/SingleChoiceOptions";
import { WeightedVoteOptions } from "@/features/governance/components/modals/vote-options/WeightedVoteOptions";
import { useOffchainProposalPrivacy } from "@/features/governance/hooks/useOffchainProposalPrivacy";
import { useOffchainVotingPower } from "@/features/governance/hooks/useOffchainVotingPower";
import { useVoteOnOffchainProposal } from "@/features/governance/hooks/useVoteOnOffchainProposal";
import { normalizeChoices } from "@/features/governance/utils/offchainProposal";
import { getOffchainVoteUiType } from "@/features/governance/utils/offchainVotingType";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { formatNumberUserReadable } from "@/shared/utils";

type VoteChoice = number | number[] | Record<string, number>;

interface OffchainVotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: OffchainProposal;
  hasVoted?: boolean;
  onVoteSuccess?: (voteLabel: string) => void;
}

export const OffchainVotingModal = ({
  isOpen,
  onClose,
  proposal,
  hasVoted = false,
  onVoteSuccess,
}: OffchainVotingModalProps) => {
  const [value, setValue] = useState<VoteChoice | null>(null);
  const [comment, setComment] = useState<string>("");

  const { address } = useAccount();
  const { vote, isPending: isVoting } = useVoteOnOffchainProposal();
  const strategies = useMemo(
    () =>
      proposal.strategies.map((s) => ({
        name: s.name,
        network: s.network,
        params: typeof s.params === "string" ? JSON.parse(s.params) : s.params,
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

  // Shutter proposals encrypt the ballot, so the reason would leak the vote —
  // hide the comment field (matching Snapshot) and gate voting until known.
  const { isShutter, isLoading: isPrivacyLoading } = useOffchainProposalPrivacy(
    proposal.id,
    { enabled: isOpen },
  );

  const choices = normalizeChoices(proposal.choices);
  const voteUiType = getOffchainVoteUiType(proposal.type);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setValue(null);
      setComment("");
    }
  }, [isOpen]);
  // Radix Dialog handles escape, focus trap, and body-scroll lock natively.

  const isVoteEnabled = (() => {
    if (!value || !address || isVoting || isPrivacyLoading) return false;
    if (voteUiType === "approval") return (value as number[]).length > 0;
    if (voteUiType === "weighted") {
      const total = Object.values(value as Record<string, number>).reduce(
        (a, b) => a + b,
        0,
      );
      return total === 100;
    }
    if (voteUiType === "quadratic") {
      const total = Object.values(value as Record<string, number>).reduce(
        (a, b) => a + b,
        0,
      );
      return total > 0;
    }
    return true;
  })();

  const computeVoteLabel = (): string => {
    if (!value) return "";
    if (typeof value === "number") {
      return choices[value - 1] ?? `Choice ${value}`;
    }
    if (Array.isArray(value)) {
      return value.map((v) => choices[v - 1] ?? `Choice ${v}`).join(", ");
    }
    return Object.entries(value as Record<string, number>)
      .filter(([, weight]) => weight > 0)
      .map(
        ([idx, weight]) =>
          `${choices[Number(idx) - 1] ?? `Choice ${idx}`} (${weight}%)`,
      )
      .join(", ");
  };

  const handleVote = async () => {
    if (!address || !value) return;
    try {
      await vote({
        spaceId: proposal.spaceId,
        proposalId: proposal.id,
        proposalType: proposal.type,
        choice: value,
        reason: comment,
      });
      showCustomToast("Vote submitted successfully!", "success");
      onVoteSuccess?.(computeVoteLabel());
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit vote";
      showCustomToast(message, "error");
    }
  };

  const renderVoteOptions = () => {
    switch (voteUiType) {
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
        return (
          <p className="text-secondary text-[14px]">
            Voting for &quot;{proposal.type}&quot; proposals is not supported in
            this app yet. Vote on{" "}
            <a
              href={proposal.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link underline"
            >
              Snapshot
            </a>
            .
          </p>
        );
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={hasVoted ? "Change Your Vote" : "Cast Your Vote"}
      description="Your vote can be updated until the proposal closes."
      cancelLabel="Cancel"
      confirmLabel="Vote"
      onConfirm={handleVote}
      isConfirmLoading={isVoting}
      isConfirmDisabled={!isVoteEnabled}
      footerLeading={
        isPrivacyLoading ? (
          <p className="text-secondary text-[12px]">
            Checking proposal privacy...
          </p>
        ) : undefined
      }
      confirmButtonProps={{
        "data-ph-event": "vote_offchain_submit",
        "data-ph-source": "gov_fe",
        "data-umami-event": "vote_offchain_submit",
      }}
      className="flex max-h-[75dvh] flex-col"
      bodyClassName="min-h-0 overflow-y-auto p-0"
    >
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
      <div className="flex flex-col items-start gap-[6px] p-4 text-left">
        <p className="font-inter text-primary text-[12px] font-medium">
          Your vote
        </p>
        <div className="w-full">{renderVoteOptions()}</div>
      </div>

      {/* Comment — omitted for shutter proposals: a plaintext reason would
            reveal the encrypted vote before the proposal closes. */}
      {isPrivacyLoading ? (
        <div className="flex flex-col gap-[6px] p-4">
          <p className="font-inter text-primary text-[12px] font-medium not-italic leading-4">
            Comment <span className="text-secondary">(optional)</span>
          </p>
          <p className="text-secondary text-[14px]">Loading...</p>
        </div>
      ) : isShutter ? (
        <div className="flex flex-col gap-[6px] p-4">
          <p className="text-secondary font-inter text-[12px] not-italic leading-4">
            Votes on this proposal are encrypted until it closes, so comments
            are disabled.
          </p>
        </div>
      ) : (
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
      )}
    </Modal>
  );
};
