import type { Address, Hash } from "viem";

import type { GaslessVoteOutcome } from "@/features/governance/utils/relayGaslessVote";
import {
  canSubmitAgain,
  needsProposalWatch,
  type ActionMode,
  type SubmissionState,
} from "@/features/governance/utils/submissionState";
import {
  readSubmission,
  submissionKey,
  writeSubmission,
} from "@/features/governance/utils/submissionStore";

/**
 * A vote's submission lives in the same page-lifetime store as queue and
 * execute, keyed by voter as well, since one tab can switch wallets. Before
 * this the modal held its own state and reset it on every open, so closing
 * mid-request or after an error put the ballot back on screen and the next
 * click replayed the same signature at the relayer.
 */
export const voteSubmissionKey = (
  daoId: string,
  proposalId: string,
  voter: Address,
): string => submissionKey(daoId, proposalId, `vote:${voter.toLowerCase()}`);

/**
 * What only a vote has beside the shared submission state, kept next to the
 * store rather than in it since queue and execute have no equivalent.
 *
 * - `support`: the choice that was submitted, so the page can say "You voted
 *   For" before the indexer catches up. Null when no ballot was cast.
 * - `alreadyVoted`: the governor already held a vote from this address, so the
 *   attempted ballot was never cast and its choice says nothing about the
 *   vote on record.
 */
export interface VoteDetails {
  support: number | null;
  alreadyVoted: boolean;
}

const NO_VOTE_DETAILS: VoteDetails = { support: null, alreadyVoted: false };

const detailsByKey = new Map<string, VoteDetails>();

export const readVoteDetails = (key: string): VoteDetails =>
  detailsByKey.get(key) ?? NO_VOTE_DETAILS;

/**
 * Whether a new ballot may be submitted. A vote that is out or in doubt never
 * allows one. A landed vote allows one only where the governor lets a voter
 * change their vote (UNI, TORN); everywhere else a second ballot could only
 * replay the first.
 */
export const canStartVote = (
  submission: SubmissionState,
  canChangeVote: boolean,
): boolean =>
  canSubmitAgain(submission) ||
  (canChangeVote &&
    submission.kind === "done" &&
    submission.outcome === "landed");

/**
 * Claims the vote for one submission. Synchronous on purpose: it runs before
 * the first await, so a double click or a reopened modal finds the claim
 * already taken and sends nothing.
 */
export const claimVote = (
  key: string,
  mode: ActionMode,
  support: number,
  canChangeVote = false,
): boolean => {
  if (!canStartVote(readSubmission(key), canChangeVote)) return false;
  detailsByKey.set(key, { support, alreadyVoted: false });
  writeSubmission(key, { kind: "in-flight", mode });
  return true;
};

/** Where a run leaves the vote, without the mode the claim already holds. */
export type VoteSettlement =
  | {
      kind: "done";
      outcome: "landed" | "failed";
      hash: Hash | null;
      /** No ballot was cast: the governor already held a vote. */
      alreadyVoted?: true;
    }
  | { kind: "ambiguous"; hash: Hash | null };

/** Settles the run in flight; a settle with nothing claimed is ignored. */
export const settleVote = (key: string, settlement: VoteSettlement): void => {
  const current = readSubmission(key);
  if (current.kind !== "in-flight") return;
  if (settlement.kind === "done" && settlement.alreadyVoted) {
    detailsByKey.set(key, { support: null, alreadyVoted: true });
    writeSubmission(key, {
      kind: "done",
      mode: current.mode,
      outcome: settlement.outcome,
      hash: settlement.hash,
    });
    return;
  }
  writeSubmission(key, { ...settlement, mode: current.mode });
};

/**
 * "already-voted" counts as landed: the governor holds a vote from this
 * address, and offering the ballot again could only replay it. A hash whose
 * receipt could not be read, or a relay answer that says nothing, may still
 * land, so neither frees the vote for another attempt.
 */
export const settlementForGaslessVote = (
  outcome: GaslessVoteOutcome,
): VoteSettlement => {
  switch (outcome.status) {
    case "success":
      return { kind: "done", outcome: "landed", hash: outcome.hash };
    case "already-voted":
      return {
        kind: "done",
        outcome: "landed",
        hash: null,
        alreadyVoted: true,
      };
    case "reverted":
      return { kind: "done", outcome: "failed", hash: outcome.hash };
    case "unconfirmed":
    case "unknown":
      return { kind: "ambiguous", hash: outcome.hash };
  }
};

/** The wallet path reports its confirmed hash, or null when nothing landed. */
export const settlementForWalletVote = (hash: Hash | null): VoteSettlement =>
  hash
    ? { kind: "done", outcome: "landed", hash }
    : { kind: "done", outcome: "failed", hash: null };

/**
 * What the voting modal shows for a submission. Only a vote that may start
 * again gets the ballot; every other state is mirrored on any open, so no
 * screen offers a submission that could replay or race another.
 */
export type VoteScreen =
  | "ballot"
  | "in-flight"
  | "landed"
  | "pending"
  | "already-voted";

export const getVoteScreen = (
  submission: SubmissionState,
  {
    canChangeVote,
    alreadyVoted,
  }: { canChangeVote: boolean; alreadyVoted: boolean },
): VoteScreen => {
  if (submission.kind === "in-flight") return "in-flight";
  if (submission.kind === "ambiguous") return "pending";
  if (alreadyVoted && !canSubmitAgain(submission)) return "already-voted";
  if (canStartVote(submission, canChangeVote)) return "ballot";
  return "landed";
};

/**
 * The submitted choice, once the vote is known to be on-chain. An ambiguous
 * submission may never land, so it does not claim a vote on the page.
 */
export const submittedVoteSupport = (
  submission: SubmissionState,
  support: number | null,
): number | undefined =>
  submission.kind === "done" &&
  submission.outcome === "landed" &&
  support !== null
    ? support
    : undefined;

/**
 * Whether the API has caught up with the submitted vote. With the transaction
 * known, only that transaction counts: a changed vote leaves the previous one
 * indexed until the new one lands. Without it (the governor already held a
 * vote), any indexed vote is the one on record.
 */
export const isSubmittedVoteIndexed = (
  submission: SubmissionState,
  latestIndexedVote: { transactionHash: string } | undefined,
): boolean => {
  if (!needsProposalWatch(submission)) return true;
  if (!latestIndexedVote) return false;
  if (!submission.hash) return true;
  return (
    latestIndexedVote.transactionHash.toLowerCase() ===
    submission.hash.toLowerCase()
  );
};
