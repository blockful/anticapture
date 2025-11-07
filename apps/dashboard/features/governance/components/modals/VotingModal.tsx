"use client";

import { Button } from "@/shared/components";
import { User2Icon, X, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";

import { Account, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DotFilledIcon } from "@radix-ui/react-icons";
import { LoadingComponent } from "@/features/governance/components/modals/LoadingContent";
import { VoteOption } from "@/features/governance/components/proposal-overview/VoteOption";
import { voteOnProposal } from "@/features/governance/utils/voteOnProposal";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Query_Proposals_Items_Items;
  votingPower: string;
  decimals: number;
}

export const VotingModal = ({
  isOpen,
  onClose,
  proposal,
  votingPower,
  decimals,
}: VotingModalProps) => {
  const [vote, setVote] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactionhash, setTransactionhash] = useState<string>("");

  const totalVotes =
    Number(proposal?.forVotes) +
    Number(proposal?.againstVotes) +
    Number(proposal?.abstainVotes);

  const userReadableTotalVotes = formatNumberUserReadable(
    Number(formatUnits(BigInt(totalVotes || 0), decimals)),
  );
  const userReadableQuorum = formatNumberUserReadable(
    Number(formatUnits(BigInt(proposal?.quorum || 0), decimals)),
  );
  const forPercentage = (Number(proposal?.forVotes) / Number(totalVotes)) * 100;
  const againstPercentage =
    (Number(proposal?.againstVotes) / Number(totalVotes)) * 100;
  const abstainPercentage =
    (Number(proposal?.abstainVotes) / Number(totalVotes)) * 100;

  const { address, chain } = useAccount();

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
                votingPower={proposal?.forVotes}
                onChange={setVote}
                checked={vote === "for"}
                decimals={decimals}
              />

              {/* Against vote  */}
              <VoteOption
                vote="against"
                optionPercentage={againstPercentage}
                votingPower={proposal?.againstVotes}
                onChange={setVote}
                checked={vote === "against"}
                decimals={decimals}
              />

              {/* Abstain vote  */}
              <VoteOption
                vote="abstain"
                optionPercentage={abstainPercentage}
                votingPower={proposal?.abstainVotes}
                onChange={setVote}
                checked={vote === "abstain"}
                decimals={decimals}
              />

              <div className="border-border-default flex items-center justify-start gap-2 border px-[10px] py-2">
                <User2Icon className="text-secondary size-3.5" />
                <p className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
                  Quorum
                </p>
                <p className="font-inter text-secondary text-[14px] font-normal not-italic leading-[20px]">
                  {userReadableTotalVotes} / {userReadableQuorum}
                </p>
              </div>
            </div>

            {/* Comment  */}
            <div className="flex flex-col gap-[6px] p-4">
              <p className="font-inter text-primary text-[12px] font-medium not-italic leading-4">
                Comment <span className="text-secondary">(optional)</span>
              </p>
              <textarea
                className="border-border-default text-primary flex h-[100px] w-full items-start gap-[var(--components-input-inner-gap,10px)] self-stretch rounded-md border bg-transparent px-[var(--components-input-padding-x,10px)] py-[var(--components-input-padding-y,8px)] focus:outline-none"
                placeholder="Enter your comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* You can also vote through  */}
            <div className="text-primary overflow-hidden px-4 pb-4">
              <div className="flex items-center justify-start gap-2 py-2">
                <p className="text-secondary font-mono text-[12px] font-medium uppercase not-italic leading-4 tracking-[0.045em]">
                  You can also vote through:
                </p>

                {/* TODO: Check links urls */}
                <DefaultLink href="https://tally.so/r/3pQ0p7" openInNewTab>
                  Tally <ExternalLink className="size-3.5 shrink-0" />
                </DefaultLink>
                <DotFilledIcon className="text-secondary size-3.5 shrink-0" />
                <DefaultLink
                  href={`https://etherscan.io/address/`}
                  openInNewTab
                >
                  Etherscan <ExternalLink className="size-3.5 shrink-0" />
                </DefaultLink>
                <DotFilledIcon className="text-secondary size-3.5 shrink-0" />
                <DefaultLink
                  href={`https://agora.blockful.io/dao/${proposal?.daoId}`}
                  openInNewTab
                >
                  Agora <ExternalLink className="size-3.5 shrink-0" />
                </DefaultLink>
              </div>
            </div>
          </>
        )}

        <div className="border-border-default flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={!address || !chain || !vote || isLoading}
            loading={isLoading}
            onClick={async () => {
              if (!address || !chain) return;
              setIsLoading(true);
              const hash = await voteOnProposal(
                vote as "for" | "against" | "abstain",
                proposal?.id as string,
                address as unknown as Account,
                chain,
                DaoIdEnum.ENS as DaoIdEnum,
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
