import { ProposalStatus } from "@/features/governance/types";
import type { GovernanceAction } from "@/features/governance/utils/submitGovernanceAction";

/**
 * The indexer picks up the queue/execute event a few blocks after the
 * receipt, so the proposal is refetched on this cadence until the relayed
 * action shows up, or until the budget runs out. 24 attempts at 5s is the
 * two minutes the modal copy promises.
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

/** Whether the indexed status already reflects the submitted action. */
export const hasIndexedGovernanceAction = (
  action: GovernanceAction,
  proposalStatus: string,
): boolean => SUCCESSOR_STATUSES[action].includes(proposalStatus.toLowerCase());

/**
 * "settled": the successor status is indexed, stop and keep it on screen.
 * "timed-out": the budget is spent, stop without having seen it.
 * "keep-polling": anything else, including a status that is neither the one
 * at submit nor a successor.
 */
export type StatusPollStep = "settled" | "timed-out" | "keep-polling";

interface StatusPollInput {
  action: GovernanceAction;
  proposalStatus: string;
  /** Refetches issued so far for this run. */
  attempts: number;
}

export const getStatusPollStep = ({
  action,
  proposalStatus,
  attempts,
}: StatusPollInput): StatusPollStep => {
  if (hasIndexedGovernanceAction(action, proposalStatus)) return "settled";
  if (attempts > STATUS_POLL_MAX_ATTEMPTS) return "timed-out";
  return "keep-polling";
};
