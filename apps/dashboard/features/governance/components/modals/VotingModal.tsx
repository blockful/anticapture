"use client";

import { Button } from "@/shared/components";
import { User2Icon, X, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";
import EnsGovernorAbi from "@/abis/ens-governor.json";
import {
  Account,
  Chain,
  createWalletClient,
  custom,
  formatEther,
  publicActions,
} from "viem";
import { useAccount } from "wagmi";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import toast from "react-hot-toast";
import { formatNumberUserReadable } from "@/shared/utils";

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Query_Proposals_Items_Items;
}

const getDaoGovernanceAddress = (daoId: DaoIdEnum) => {
  return daoConfigByDaoId[daoId].daoOverview.contracts?.governor;
};

const showCustomToast = (message: string) => {
  toast.custom(
    (t) => (
      <div
        className={`bg-error flex max-w-[500px] items-center justify-between gap-4 px-6 py-4 text-black shadow-lg transition-all ${
          t.visible ? "animate-enter" : "animate-leave"
        }`}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 flex-shrink-0" />
          <span className="font-inter text-base font-normal leading-6">
            {message}
          </span>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 transition-opacity hover:opacity-70"
          aria-label="Close notification"
        >
          <X className="size-5" />
        </button>
      </div>
    ),
    {
      duration: 4000,
      position: "bottom-left",
    },
  );
};

const handleVote = async (
  vote: "for" | "against" | "abstain",
  proposalId: string,
  account: Account,
  chain: Chain,
  daoId: DaoIdEnum,

  comment?: string,
) => {
  console.log(vote);
  console.log(comment);
  console.log(proposalId);

  const daoGovernanceAddress = getDaoGovernanceAddress(daoId);

  if (!daoGovernanceAddress) {
    throw new Error("DAO governance address not found");
  }

  const voteNumber = vote === "for" ? 1 : vote === "against" ? 0 : 2;

  const walletClient = createWalletClient({
    account: account,
    chain: chain,
    transport: custom(window.ethereum),
  });

  const client = walletClient.extend(publicActions);

  try {
    let request;

    if (!comment) {
      const simulatedRequest = await client.simulateContract({
        abi: EnsGovernorAbi,
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        functionName: "castVote",
        args: [proposalId, voteNumber],
      });

      request = simulatedRequest.request;
    } else {
      const simulatedRequest = await client.simulateContract({
        abi: EnsGovernorAbi,
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        functionName: "castVoteWithReason",
        args: [proposalId, voteNumber, comment],
      });

      request = simulatedRequest.request;
    }

    if (!request) {
      throw new Error("Request not found");
    }

    const hash = await client.writeContract(request);
    return hash;
  } catch (error) {
    console.error(error);
    showCustomToast("Failed to vote");
    return null;
  }
};

export const VotingModal = ({
  isOpen,
  onClose,
  proposal,
}: VotingModalProps) => {
  const [vote, setVote] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const totalVotes =
    Number(proposal?.forVotes) +
    Number(proposal?.againstVotes) +
    Number(proposal?.abstainVotes);

  const userReadableForVotes = formatNumberUserReadable(
    Number(formatEther(BigInt(proposal?.forVotes || "0"))),
  );
  const userReadableAgainstVotes = formatNumberUserReadable(
    Number(formatEther(BigInt(proposal?.againstVotes || "0"))),
  );
  const userReadableAbstainVotes = formatNumberUserReadable(
    Number(formatEther(BigInt(proposal?.abstainVotes || "0"))),
  );

  const userReadableTotalVotes = formatNumberUserReadable(
    Number(formatEther(BigInt(Number(totalVotes || "0")))),
  );
  const userReadableQuorum = formatNumberUserReadable(
    Number(formatEther(BigInt(Number(proposal?.quorum || "0")))),
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

        {/* your vote  */}
        <div className="flex flex-col gap-[6px] p-4">
          <p>Your vote</p>

          {/* For vote  */}
          <div className="flex flex-col">
            <div className="border-border-default flex items-center justify-between border px-[10px] py-2">
              <div className="flex items-center gap-2">
                <div className="flex w-[100px] items-center gap-2">
                  <input
                    className="border-primary checked:border-primary checked:bg-primary box-border h-4 w-4 cursor-pointer appearance-none rounded-full border-2 bg-transparent"
                    type="radio"
                    name="vote"
                    id="for"
                    checked={vote === "for"}
                    onChange={() => setVote("for")}
                  />
                  <p className="font-inter text-success text-[14px] font-normal not-italic leading-[20px]">
                    For
                  </p>
                </div>

                <div className="bg-surface-hover relative h-1 w-[270px]">
                  <div
                    className="bg-success h-1"
                    style={{ width: `${forPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {userReadableForVotes}
                </p>
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {forPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Against vote  */}
          <div className="flex flex-col">
            <div className="border-border-default flex items-center justify-between border px-[10px] py-2">
              <div className="flex items-center gap-2">
                <div className="flex w-[100px] items-center gap-2">
                  <input
                    className="border-primary checked:border-primary checked:bg-primary box-border h-4 w-4 cursor-pointer appearance-none rounded-full border-2 bg-transparent"
                    type="radio"
                    name="vote"
                    id="for"
                    checked={vote === "against"}
                    onChange={() => setVote("against")}
                  />
                  <p className="font-inter text-error text-[14px] font-normal not-italic leading-[20px]">
                    Against
                  </p>
                </div>

                <div className="bg-surface-hover relative h-1 w-[270px]">
                  <div
                    className="bg-error h-1"
                    style={{ width: `${againstPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {userReadableAgainstVotes}
                </p>
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {againstPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Abstain vote  */}
          <div className="flex flex-col">
            <div className="border-border-default flex items-center justify-between border px-[10px] py-2">
              <div className="flex items-center gap-2">
                <div className="flex w-[100px] items-center gap-2">
                  <input
                    className="border-primary checked:border-primary checked:bg-primary box-border h-4 w-4 cursor-pointer appearance-none rounded-full border-2 bg-transparent"
                    type="radio"
                    name="vote"
                    id="for"
                    checked={vote === "abstain"}
                    onChange={() => setVote("abstain")}
                  />
                  <p className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
                    Abstain
                  </p>
                </div>

                <div className="bg-surface-hover relative h-1 w-[270px]">
                  <div
                    className="bg-primary h-1"
                    style={{ width: `${abstainPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {userReadableAbstainVotes}
                </p>
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {abstainPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

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
          <p className="font-inter text-[12px] font-medium not-italic leading-4">
            Comment <span className="text-secondary">(optional)</span>
          </p>
          <textarea
            className="border-border-default flex h-[100px] w-full items-start gap-[var(--components-input-inner-gap,10px)] self-stretch rounded-md border bg-transparent px-[var(--components-input-padding-x,10px)] py-[var(--components-input-padding-y,8px)] focus:outline-none"
            placeholder="Enter your comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div className="border-border-default flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!address || !chain}
            onClick={async () => {
              if (!address || !chain) return;
              const hash = await handleVote(
                vote as "for" | "against" | "abstain",
                proposal?.id as string,
                address as unknown as Account,
                chain,
                DaoIdEnum.ENS as DaoIdEnum,
                comment,
              );
              if (hash) {
                showCustomToast("Vote submitted successfully!");
                onClose();
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
