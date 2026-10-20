import type { Address, Hash } from "viem";

import type { GaslessVoteOutcome } from "@/features/governance/utils/relayGaslessVote";
import {
  canSubmitAgain,
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
 * The choice that was submitted, so the page can say "You voted For" before
 * the indexer has caught up. Kept beside the store rather than in it, since
 * queue and execute have no equivalent.
 */
const supportByKey = new Map<string, number>();

export const readVoteSupport = (key: string): number | null =>
  supportByKey.get(key) ?? null;

/**
 * Claims the vote for one submission. Synchronous on purpose: it runs before
 * the first await, so a double click or a reopened modal finds the claim
 * already taken and sends nothing.
 */
export const claimVote = (
  key: string,
  mode: ActionMode,
  support: number,
): boolean => {
  if (!canSubmitAgain(readSubmission(key))) return false;
  supportByKey.set(key, support);
  writeSubmission(key, { kind: "in-flight", mode });
  return true;
};

/** Where a run leaves the vote, without the mode the claim already holds. */
export type VoteSettlement =
  | { kind: "done"; outcome: "landed" | "failed"; hash: Hash | null }
  | { kind: "ambiguous"; hash: Hash | null };

/** Settles the run in flight; a settle with nothing claimed is ignored. */
export const settleVote = (key: string, settlement: VoteSettlement): void => {
  const current = readSubmission(key);
  if (current.kind !== "in-flight") return;
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
    case "already-voted":
      return { kind: "done", outcome: "landed", hash: outcome.hash };
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
 * What the voting modal shows for a submission. Only an untouched vote, or
 * one whose last attempt changed nothing, gets the ballot; every other state
 * is mirrored on any open, so no screen offers a second submission.
 */
export type VoteScreen = "ballot" | "in-flight" | "landed" | "pending";

export const getVoteScreen = (submission: SubmissionState): VoteScreen => {
  if (canSubmitAgain(submission)) return "ballot";
  if (submission.kind === "in-flight") return "in-flight";
  if (submission.kind === "ambiguous") return "pending";
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
