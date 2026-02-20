"use client";

import { BadgeStatus, Button } from "@/shared/components";
import { Check, User2Icon, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";

import { Account, formatUnits } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import { LoadingComponent } from "@/features/governance/components/modals/LoadingContent";
import { VoteOption } from "@/features/governance/components/proposal-overview/VoteOption";
import { voteOnProposal } from "@/features/governance/utils/voteOnProposal";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Query_Proposals_Items_Items;
  votingPower: string;
  rawVotingPower: string;
  decimals: number;
}

export const VotingModal = ({
  isOpen,
  onClose,
  proposal,
  votingPower,
  rawVotingPower,
  decimals,
}: VotingModalProps) => {
  const [vote, setVote] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactionhash, setTransactionhash] = useState<string>("");

  // Parse user's voting power to BigInt for calculations
  const userVotingPowerBigInt = BigInt(rawVotingPower || "0");

  // Calculate base votes from proposal
  const baseForVotes = BigInt(proposal?.forVotes || "0");
  const baseAgainstVotes = BigInt(proposal?.againstVotes || "0");
  const baseAbstainVotes = BigInt(proposal?.abstainVotes || "0");

  // Calculate simulated votes based on user's selection
  const simulatedForVotes =
    vote === "for" ? baseForVotes + userVotingPowerBigInt : baseForVotes;
  const simulatedAgainstVotes =
    vote === "against"
      ? baseAgainstVotes + userVotingPowerBigInt
      : baseAgainstVotes;
  const simulatedAbstainVotes =
    vote === "abstain"
      ? baseAbstainVotes + userVotingPowerBigInt
      : baseAbstainVotes;

  // Calculate simulated total (includes user's voting power if any option is selected)
  const simulatedTotalVotes =
    simulatedForVotes + simulatedAgainstVotes + simulatedAbstainVotes;

  // Calculate simulated quorum votes (for + abstain only, against votes don't count toward quorum)
  const simulatedQuorumVotes = simulatedForVotes + simulatedAbstainVotes;

  const userReadableQuorumVotes = formatNumberUserReadable(
    Number(formatUnits(simulatedQuorumVotes || BigInt(0), decimals)),
  );
  const userReadableQuorum = formatNumberUserReadable(
    Number(formatUnits(BigInt(proposal?.quorum || 0), decimals)),
  );

  // Calculate percentages based on simulated values
  const forPercentage =
    simulatedTotalVotes > BigInt(0)
      ? (Number(simulatedForVotes) / Number(simulatedTotalVotes)) * 100
      : 0;
  const againstPercentage =
    simulatedTotalVotes > BigInt(0)
      ? (Number(simulatedAgainstVotes) / Number(simulatedTotalVotes)) * 100
      : 0;
  const abstainPercentage =
    simulatedTotalVotes > BigInt(0)
      ? (Number(simulatedAbstainVotes) / Number(simulatedTotalVotes)) * 100
      : 0;

  const isQuorumReached =
    Number(simulatedQuorumVotes) >= Number(proposal?.quorum || 0);

  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Reset state when modal opens to prevent stale data from previous sessions
  useEffect(() => {
    if (isOpen) {
      setVote("");
      setComment("");
      setIsLoading(false);
      setTransactionhash("");
    }
  }, [isOpen]);

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

        {/* Content */}
        {isLoading ? (
          <LoadingComponent
            transactionhash={transactionhash}
            proposalId={proposal?.id as string}
            proposalTitle={proposal?.title as string}
            votingPower={votingPower}
            vote={vote as "for" | "against" | "abstain"}
          />
        ) : (
          <>
            {/* your vote  */}
            <div className="flex flex-col gap-[6px] p-4">
              <p className="font-inter text-primary text-[12px] font-medium not-italic leading-4">
                Your vote
              </p>

              {/* For vote  */}
              <VoteOption
                vote="for"
                optionPercentage={forPercentage}
                votingPower={simulatedForVotes.toString()}
                onChange={setVote}
                checked={vote === "for"}
                decimals={decimals}
              />

              {/* Against vote  */}
              <VoteOption
                vote="against"
                optionPercentage={againstPercentage}
                votingPower={simulatedAgainstVotes.toString()}
                onChange={setVote}
                checked={vote === "against"}
                decimals={decimals}
              />

              {/* Abstain vote  */}
              <VoteOption
                vote="abstain"
                optionPercentage={abstainPercentage}
                votingPower={simulatedAbstainVotes.toString()}
                onChange={setVote}
                checked={vote === "abstain"}
                decimals={decimals}
              />

              <div className="border-border-default bg-surface-contrast flex items-center justify-start gap-2 border px-[10px] py-2">
                <User2Icon className="text-secondary size-3.5" />
                <p className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
                  Quorum
                </p>
                <p className="font-inter text-secondary text-[14px] font-normal not-italic leading-[20px]">
                  {userReadableQuorumVotes} / {userReadableQuorum}
                </p>
                {isQuorumReached ? (
                  <BadgeStatus
                    variant="success"
                    iconClassName="text-success!"
                    icon={Check}
                  >
                    Reached
                  </BadgeStatus>
                ) : (
                  <BadgeStatus variant="dimmed">Not Reached</BadgeStatus>
                )}
              </div>
            </div>

            {/* Comment  */}
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
          </>
        )}

        <div className="border-border-default flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            data-ph-event="vote_submit"
            data-ph-source="gov_fe"
            data-umami-event="vote_submit"
            disabled={!address || !chain || !vote || !walletClient || isLoading}
            loading={isLoading}
            onClick={async () => {
              if (!address || !chain || !walletClient) return;
              setIsLoading(true);
              const hash = await voteOnProposal(
                vote as "for" | "against" | "abstain",
                proposal?.id as string,
                address as unknown as Account,
                chain,
                DaoIdEnum.ENS as DaoIdEnum,
                walletClient,
                setTransactionhash,
                comment,
              );
              setIsLoading(false);
              if (hash) {
                onClose();
                // Reload the page to fetch fresh data
                window.location.reload();
                showCustomToast("Vote submitted successfully!", "success");
              }
            }}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};
