import type { Hash } from "viem";

/** How a submission was sent: the user's own wallet, or the relayer. */
export type ActionMode = "wallet" | "gasless";

/**
 * What the modal knows about the proposal action it owns, for as long as the
 * page lives.
 *
 * - "idle": nothing has been submitted yet.
 * - "in-flight": a submission is out and unresolved. No second one may start,
 *   because a wallet transaction racing a relayed one duplicates the governor
 *   call and the loser pays gas for a revert. Dismissing the modal does not
 *   end this state: the request carries on regardless of the screen.
 * - "ambiguous": a submission may or may not have reached the chain. There is
 *   no safe retry, so this is terminal. `hash` is null when even the send is
 *   in doubt, which is why the screen cannot always offer an explorer link.
 * - "done": a submission resolved definitively. `outcome` says which half of
 *   that it was: a transaction that landed changed the proposal, so the
 *   action must not be offered again, while a failure changed nothing and may
 *   be retried. Every state but "idle" carries the mode, so any mount can
 *   describe the submission the same way the one that made it would have.
 */
export type SubmissionState =
  | { kind: "idle" }
  | { kind: "in-flight"; mode: ActionMode }
  | { kind: "ambiguous"; mode: ActionMode; hash: Hash | null }
  | {
      kind: "done";
      mode: ActionMode;
      outcome: SubmissionOutcome;
      hash: Hash | null;
    };

/**
 * What a definitively settled run did to the chain.
 *
 * - "landed": a transaction was mined and did what it was asked. The proposal
 *   should change, so the action must not be offered again and something has
 *   to keep watching until the indexer catches up.
 * - "failed": nothing changed on-chain, whether because nothing was ever sent
 *   or because the transaction was mined and reverted. There is nothing to
 *   watch for and a retry is safe, which is what the error screen offers.
 */
export type SubmissionOutcome = "landed" | "failed";

/** What a run reports about itself once it settles definitively. */
export interface SettledSubmission {
  outcome: SubmissionOutcome;
  hash: Hash | null;
}

export const SUBMISSION_FAILED: SettledSubmission = {
  outcome: "failed",
  hash: null,
};

/**
 * A state where a transaction may exist and nothing on this mount is watching
 * for it: the run that would have is finished or belongs to a mount that is
 * gone. Whoever lands on one of these has to show the transaction and pick
 * the proposal watch back up, and must offer no way to submit again.
 */
export type WatchedSubmission =
  | { kind: "ambiguous"; mode: ActionMode; hash: Hash | null }
  | {
      kind: "done";
      mode: ActionMode;
      outcome: "landed";
      hash: Hash | null;
    };

export const needsProposalWatch = (
  state: SubmissionState,
): state is WatchedSubmission =>
  state.kind === "ambiguous" ||
  (state.kind === "done" && state.outcome === "landed");

export const IDLE_SUBMISSION: SubmissionState = { kind: "idle" };

/**
 * Whether another submission may start. The one rule the entry point, the
 * close handler and both action buttons ask, so a state can never allow the
 * action in one place and refuse it in another.
 *
 * It is the exact complement of a submission worth watching, plus the request
 * that has yet to resolve: anything that may have put a transaction on-chain
 * keeps its screen through a close and offers no way to send a second one.
 * Only an untouched action, or one whose last attempt changed nothing, falls
 * through to the choices.
 */
export const canSubmitAgain = (state: SubmissionState): boolean =>
  state.kind === "idle" ||
  (state.kind === "done" && state.outcome === "failed");

/**
 * Where an opening modal should land.
 *
 * "mirror-submission" is every dismissed-and-reopened case: a request still
 * out, an ambiguous outcome, or a transaction that landed and has yet to be
 * indexed. The screen describing it is already standing, painted by the run
 * that made it or by the effect that follows the store, so opening leaves it
 * alone and offers no way to start another.
 */
export type ModalEntryPoint =
  | "mirror-submission"
  | "choose"
  | "wallet"
  | "connect-wallet"
  | "switch-network";

interface ModalEntryInput {
  submission: SubmissionState;
  isGaslessAvailable: boolean;
  hasAddress: boolean;
  hasWalletClient: boolean;
}

export const getModalEntryPoint = ({
  submission,
  isGaslessAvailable,
  hasAddress,
  hasWalletClient,
}: ModalEntryInput): ModalEntryPoint => {
  if (!canSubmitAgain(submission)) return "mirror-submission";
  if (isGaslessAvailable) return "choose";
  if (!hasAddress) return "connect-wallet";
  if (!hasWalletClient) return "switch-network";
  return "wallet";
};
