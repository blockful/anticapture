import { ProposalStatus } from "@/features/governance/types";
import type { GovernanceAction } from "@/features/governance/utils/submitGovernanceAction";

/**
 * The indexer picks up the queue/execute event a few blocks after the
 * receipt, so the proposal is refetched on this cadence until the relayed
 * action shows up, or until the budget runs out. The first refetch goes out
 * as soon as the receipt lands and counts towards the budget, so 24 of them
 * at 5s apart is the two minutes the modal copy promises.
 */
export const STATUS_POLL_MS = 5_000;
export const STATUS_POLL_MAX_ATTEMPTS = 24;

/**
 * Statuses that prove the submitted action reached the indexer, one set per
 * action.
 *
 * Polling cannot stop on "any status other than the one at submit". While an
 * ENS/OZ proposal waits to be executed, the API's `getProposalStatus` falls
 * back to the indexed value whenever its timelock and grace period RPC reads
 * fail, so the status can flicker from `pending_execution` back to `queued`
 * without the execute having been indexed at all. Stopping on that flicker
 * leaves the stale action on screen until some other refetch happens.
 *
 * Queue accepts the whole downstream family: the timelock eta turns `queued`
 * into `pending_execution`, and a fast execute or a missed grace period can
 * carry it further still. None of those states is reachable until the queue
 * transaction has been indexed.
 */
const SUCCESSOR_STATUSES: Record<GovernanceAction, readonly string[]> = {
  queue: [
    ProposalStatus.QUEUED,
    ProposalStatus.PENDING_EXECUTION,
    ProposalStatus.EXECUTED,
    ProposalStatus.EXPIRED,
  ],
  execute: [ProposalStatus.EXECUTED],
};

/**
 * Statuses that put the action out of reach for good. The submitted
 * transaction can no longer be indexed as a success from here, so spending
 * the rest of the budget waiting for it only delays the screen catching up
 * with what the proposal actually says.
 *
 * `expired` belongs to execute alone: a queued proposal that outlived its
 * grace period can never be executed, while for queue it is proof the queue
 * itself was indexed.
 */
const TERMINAL_STATUSES: Record<GovernanceAction, readonly string[]> = {
  queue: [
    ProposalStatus.CANCELED,
    ProposalStatus.DEFEATED,
    ProposalStatus.NO_QUORUM,
  ],
  execute: [
    ProposalStatus.CANCELED,
    ProposalStatus.DEFEATED,
    ProposalStatus.NO_QUORUM,
    ProposalStatus.EXPIRED,
  ],
};

/** Whether the indexed status already reflects the submitted action. */
export const hasIndexedGovernanceAction = (
  action: GovernanceAction,
  proposalStatus: string,
): boolean => SUCCESSOR_STATUSES[action].includes(proposalStatus.toLowerCase());

/** Whether the proposal moved somewhere the submitted action can never land. */
export const hasSupersededGovernanceAction = (
  action: GovernanceAction,
  proposalStatus: string,
): boolean => TERMINAL_STATUSES[action].includes(proposalStatus.toLowerCase());

/**
 * "settled": the successor status is indexed, stop and keep it on screen.
 * "superseded": the proposal moved somewhere the action cannot land, so stop
 * and let the screen show the status it actually has.
 * "timed-out": the budget is spent, stop without having seen it.
 * "keep-polling": anything else, including a status that is neither the one
 * at submit nor a successor.
 */
export type StatusPollStep =
  | "settled"
  | "superseded"
  | "timed-out"
  | "keep-polling";

interface StatusPollInput {
  action: GovernanceAction;
  proposalStatus: string;
  /** Refetches issued so far for this run, the first one included. */
  attempts: number;
}

export const getStatusPollStep = ({
  action,
  proposalStatus,
  attempts,
}: StatusPollInput): StatusPollStep => {
  if (hasIndexedGovernanceAction(action, proposalStatus)) return "settled";
  if (hasSupersededGovernanceAction(action, proposalStatus)) {
    return "superseded";
  }
  if (attempts >= STATUS_POLL_MAX_ATTEMPTS) return "timed-out";
  return "keep-polling";
};
