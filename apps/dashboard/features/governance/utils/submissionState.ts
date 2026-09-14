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
 * - "done": a submission resolved definitively, mined, reverted, or never
 *   sent at all. Another submission is allowed. `sent` says whether a
 *   transaction went out, which is what a mount that inherits this state
 *   needs: it did not see the outcome, so it has to keep watching the
 *   proposal rather than offer the action as though nothing had happened.
 *   Every state but "idle" carries the mode, so any mount can describe the
 *   submission the same way the one that made it would have.
 */
export type SubmissionState =
  | { kind: "idle" }
  | { kind: "in-flight"; mode: ActionMode }
  | { kind: "ambiguous"; mode: ActionMode; hash: Hash | null }
  | { kind: "done"; mode: ActionMode; sent: boolean; hash: Hash | null };

/** What a run reports about itself once it settles definitively. */
export interface SettledSubmission {
  sent: boolean;
  hash: Hash | null;
}

export const NOTHING_SENT: SettledSubmission = { sent: false, hash: null };

export const IDLE_SUBMISSION: SubmissionState = { kind: "idle" };

/**
 * Whether another submission may start. This doubles as the test for whether
 * the modal may reset its screen: the two answers are the same, since a state
 * that forbids a new submission is one whose screen has to survive a close.
 */
export const canStartSubmission = (state: SubmissionState): boolean =>
  state.kind === "idle" || state.kind === "done";

/**
 * Where an opening modal should land.
 *
 * "mirror-submission" and "ambiguous-outcome" are the dismissed-and-reopened
 * cases. Both show what happened to the submission and offer no way to start
 * another, so neither can be raced or duplicated.
 */
export type ModalEntryPoint =
  | "mirror-submission"
  | "ambiguous-outcome"
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
  if (submission.kind === "in-flight") return "mirror-submission";
  if (submission.kind === "ambiguous") return "ambiguous-outcome";
  if (isGaslessAvailable) return "choose";
  if (!hasAddress) return "connect-wallet";
  if (!hasWalletClient) return "switch-network";
  return "wallet";
};
