import {
  IDLE_SUBMISSION,
  type SubmissionState,
} from "@/features/governance/utils/submissionState";

/**
 * Where a proposal action's submission state lives, for the life of the page
 * rather than the life of a component.
 *
 * A modal held its own state until this existed, which meant navigating away
 * from the proposal and back unmounted it and reset the state to idle. The
 * relayer or wallet request from the previous mount was still unresolved, the
 * button was still on screen because nothing had been indexed yet, and a
 * second governor call could go out. Keying by DAO, proposal and action keeps
 * the queue and execute modals independent while surviving any remount.
 */
const submissions = new Map<string, SubmissionState>();
const listeners = new Map<string, Set<() => void>>();

/**
 * A session that browses proposal after proposal would otherwise grow this
 * map for the life of the tab. Entries are dropped in the order they were
 * first written, and only where the state is settled: an unresolved or
 * ambiguous entry is the thing that stops a duplicate submission, so it is
 * never evicted no matter how old it is. Of the settled entries, a failed
 * attempt goes first: reading it back is the same as never having submitted.
 * A landed transaction still keeps the action closed until it is indexed, so
 * it is evicted only once no failed entry is left to evict.
 */
const MAX_TRACKED_SUBMISSIONS = 50;

const isSettledAs = (
  state: SubmissionState,
  outcome: "failed" | "landed",
): boolean => state.kind === "done" && state.outcome === outcome;

const evictOldestSettled = () => {
  if (submissions.size <= MAX_TRACKED_SUBMISSIONS) return;

  for (const outcome of ["failed", "landed"] as const) {
    for (const [key, state] of submissions) {
      if (isSettledAs(state, outcome)) {
        submissions.delete(key);
        return;
      }
    }
  }
};

export const submissionKey = (
  daoId: string,
  proposalId: string,
  action: string,
): string => `${daoId}:${proposalId}:${action}`;

export const readSubmission = (key: string): SubmissionState =>
  submissions.get(key) ?? IDLE_SUBMISSION;

export const writeSubmission = (key: string, state: SubmissionState): void => {
  submissions.set(key, state);
  evictOldestSettled();
  listeners.get(key)?.forEach((listener) => listener());
};

/**
 * Notifies on every write to one key. A request started before a remount
 * resolves against a component that is already gone, so the mount that took
 * its place has to hear about the outcome from here.
 */
export const subscribeToSubmission = (
  key: string,
  listener: () => void,
): (() => void) => {
  const forKey = listeners.get(key) ?? new Set<() => void>();
  forKey.add(listener);
  listeners.set(key, forKey);

  return () => {
    forKey.delete(listener);
    if (forKey.size === 0) listeners.delete(key);
  };
};
