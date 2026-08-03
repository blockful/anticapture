"use client";

import { CircleCheck } from "lucide-react";

import { Modal } from "@/shared/components/design-system/modal/Modal";
import { cn } from "@/shared/utils/cn";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

interface OffchainVotedModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Opens the interactive ballot so the voter can replace this vote. */
  onChangeVote: () => void;
  /**
   * False once voting has closed: Snapshot rejects a late vote, so the ballot
   * must not be offered at all.
   */
  canChangeVote: boolean;
  choices: string[];
  /**
   * Per-choice share as percentages, aligned with `choices`. Null for ballots
   * where a share is not meaningful (approval, ranked), which fall back to
   * listing the chosen options.
   */
  weights: number[] | null;
  /** Chosen option labels, in submission order. Used when `weights` is null. */
  choiceLabels: string[];
  /** Vote timestamp, in Unix seconds. */
  votedAt: number;
  votingPower: number;
  tokenSymbol: string;
  comment?: string | null;
}

export const OffchainVotedModal = ({
  isOpen,
  onClose,
  onChangeVote,
  canChangeVote,
  choices,
  weights,
  choiceLabels,
  votedAt,
  votingPower,
  tokenSymbol,
  comment,
}: OffchainVotedModalProps) => {
  const votedOn = new Date(votedAt * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Your Vote"
      description={
        canChangeVote
          ? "You can change your vote until the proposal closes."
          : "Voting has closed, so this vote is final."
      }
      cancelLabel="Close"
      confirmLabel={canChangeVote ? "Change vote" : undefined}
      onConfirm={canChangeVote ? onChangeVote : undefined}
      className="flex max-h-[75dvh] flex-col"
      bodyClassName="min-h-0 overflow-y-auto p-0"
    >
      {/* Single padded body, 16px gap between sections, matching the frames. */}
      <div className="flex flex-col gap-4 p-4">
        <div className="bg-surface-opacity-success flex w-full items-center gap-2 px-4 py-3">
          <CircleCheck className="text-success size-4 shrink-0" />
          <p className="text-success text-[14px] leading-5">
            You voted · {votedOn} · {formatNumberUserReadable(votingPower)}{" "}
            {tokenSymbol}
          </p>
        </div>

        <div className="flex flex-col gap-[6px]">
          <p className="font-inter text-primary text-[12px] font-medium leading-4">
            Your vote
          </p>
          <div className="flex flex-col gap-2">
            {weights
              ? choices.map((label, index) => {
                  const percent = weights[index] ?? 0;
                  const isChosen = percent > 0;
                  return (
                    <div
                      key={label + index}
                      className="border-border-default flex w-full flex-col gap-2 border px-[10px] py-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-[14px] leading-5">
                        <span
                          className={cn(
                            "min-w-0 truncate",
                            isChosen ? "text-primary" : "text-dimmed",
                          )}
                        >
                          {label}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-medium",
                            isChosen ? "text-primary" : "text-dimmed",
                          )}
                        >
                          {percent}%
                        </span>
                      </div>
                      <div className="bg-surface-contrast flex h-1 w-full items-start">
                        {isChosen && (
                          <div
                            className="bg-primary h-1"
                            style={{ width: `${percent}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              : choiceLabels.map((label, index) => (
                  <div
                    key={label + index}
                    className="border-border-default flex w-full items-center gap-2 border px-[10px] py-2"
                  >
                    {choiceLabels.length > 1 && (
                      <span className="text-dimmed shrink-0 text-[14px] font-medium leading-5">
                        {index + 1}
                      </span>
                    )}
                    <span className="text-primary min-w-0 truncate text-[14px] leading-5">
                      {label}
                    </span>
                  </div>
                ))}
          </div>
        </div>

        {comment && comment.trim() !== "" && (
          <div className="flex flex-col gap-[6px]">
            <p className="font-inter text-primary text-[12px] font-medium leading-4">
              Your comment
            </p>
            <p className="text-secondary text-[14px] leading-5">
              &ldquo;{comment}&rdquo;
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
