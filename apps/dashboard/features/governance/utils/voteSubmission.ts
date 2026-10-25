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
 * How this voter's ballot is to be paid for, beyond what the relayer status
 * says. Keyed like the submission, so it follows the voter rather than the
 * modal: a second account in the same tab starts clean, and a remount of the
 * proposal page does not offer the relayer that just refused this voter.
 *
 * - `gaslessFailure`: why the last relayed attempt did not go through. Once
 *   set, the ballot stays on the wallet for the life of the page, since the
 *   same relayer would most likely refuse the same voter the same way.
 * - `prefersWallet`: the voter chose to pay gas while the relayer was on offer.
 */
export interface WalletFallback {
  gaslessFailure: string | null;
  prefersWallet: boolean;
}

const NO_WALLET_FALLBACK: WalletFallback = {
  gaslessFailure: null,
  prefersWallet: false,
};

const fallbackByKey = new Map<string, WalletFallback>();
const fallbackListeners = new Set<() => void>();

export const readWalletFallback = (key: string | null): WalletFallback =>
  (key ? fallbackByKey.get(key) : undefined) ?? NO_WALLET_FALLBACK;

export const updateWalletFallback = (
  key: string,
  patch: Partial<WalletFallback>,
): void => {
  fallbackByKey.set(key, { ...readWalletFallback(key), ...patch });
  for (const listener of fallbackListeners) listener();
};

export const subscribeToWalletFallback = (onChange: () => void) => {
  fallbackListeners.add(onChange);
  return () => {
    fallbackListeners.delete(onChange);
  };
};

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

/**
 * Frees a relayed vote the relayer never confirmed, once the chain shows no
 * vote from this address, so the voter can cast it from their own wallet.
 *
 * The caller reads `hasVoted` first and, when the relayer returned a hash,
 * checks that the transaction is not still waiting in the mempool: a hash
 * proves the relayer sent it, not that it will land, and a dropped or
 * reverted one would otherwise strand the voter on a screen that waits for
 * it forever. The relayer may still broadcast late after this; the worst
 * that leaves is two transactions for one ballot, and the governor counts
 * only the first. The second reverts and costs its sender gas, which is
 * cheaper than a voter who cannot vote, and the wallet path reads the chain
 * again before and after it sends.
 */
export const releaseUnlandedVote = (key: string): boolean => {
  const current = readSubmission(key);
  if (current.kind !== "ambiguous" || current.mode !== "gasless") {
    return false;
  }
  writeSubmission(key, {
    kind: "done",
    mode: "gasless",
    outcome: "failed",
    hash: current.hash,
  });
  return true;
};

/**
 * Settles a vote whose outcome was in doubt once the chain shows a vote from
 * this address: the relayed one landed after all. The submission becomes a
 * landed vote, so the screen says so and the page keeps watching for it to
 * be indexed, instead of offering the voter another way to cast it.
 */
export const confirmLandedVote = (key: string): boolean => {
  const current = readSubmission(key);
  if (current.kind !== "ambiguous") return false;
  writeSubmission(key, {
    kind: "done",
    mode: current.mode,
    outcome: "landed",
    hash: current.hash,
  });
  return true;
};

/**
 * A wallet vote that found the governor already holding a vote from this
 * address: an earlier relayed one landed first. That vote is the one that
 * counts, so the run settles as landed and the screen says the vote was
 * already cast, rather than reporting a failure and offering the ballot again.
 */
export const ALREADY_ON_CHAIN: VoteSettlement = {
  kind: "done",
  outcome: "landed",
  hash: null,
  alreadyVoted: true,
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
