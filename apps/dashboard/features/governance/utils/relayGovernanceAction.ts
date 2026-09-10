import type { Hash, PublicClient } from "viem";

import { relayExecute, relayQueue } from "@anticapture/client";
import type {
  RelayExecutePathParamsDaoEnumKey,
  RelayQueuePathParamsDaoEnumKey,
} from "@anticapture/client";

import type { GovernanceAction } from "@/features/governance/utils/submitGovernanceAction";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  isRelayerEnactmentRejection,
  isRelayerTransactionReverted,
} from "@/shared/utils/gaslessRelayerError";

/**
 * Governor state each relayed action requires, expressed in the dashboard's
 * lowercase status vocabulary. The API reports `queued` while the timelock
 * delay is still running and `pending_execution` once the eta has passed, so
 * gating on these keeps the relayer from being asked for a call it would
 * reject with INVALID_PROPOSAL_STATE or TIMELOCK_NOT_READY.
 */
const RELAYABLE_STATUS: Record<GovernanceAction, string> = {
  queue: "succeeded",
  execute: "pending_execution",
};

export const canRelayGovernanceAction = (
  action: GovernanceAction,
  proposalStatus: string,
): boolean => proposalStatus.toLowerCase() === RELAYABLE_STATUS[action];

/**
 * Why the relayer cannot take this action right now, or null when it can.
 * Only the timelock case gets a dedicated message: it is the one state where
 * the button is visible but the action must wait.
 */
export const getRelayBlockedReason = (
  action: GovernanceAction,
  proposalStatus: string,
): string | null => {
  if (canRelayGovernanceAction(action, proposalStatus)) return null;
  if (action === "execute" && proposalStatus.toLowerCase() === "queued") {
    return "The timelock delay has not passed yet. This proposal can be executed once it is ready.";
  }
  return action === "queue"
    ? "Only succeeded proposals can be queued."
    : "Only queued proposals with an elapsed timelock can be executed.";
};

/** The only public-client capability this flow needs. */
export type ReceiptWaiter = Pick<PublicClient, "waitForTransactionReceipt">;

/**
 * What the dashboard knows about the relayed transaction once the call
 * settles.
 *
 * - "success" / "reverted": the receipt was read locally.
 * - "unconfirmed": the relayer returned a hash but the local receipt check
 *   could not run or timed out.
 * - "unknown": the request failed without a relayer rejection code (network
 *   error, gateway timeout, plain 5xx). The relayer may already have
 *   broadcast the transaction, so this must not be shown as a failure or
 *   followed by an automatic retry.
 */
export type RelayOutcome =
  | { status: "success" | "reverted" | "unconfirmed"; hash: Hash }
  | { status: "unknown"; hash: null };

type RelayGovernanceActionParams = {
  action: GovernanceAction;
  daoId: DaoIdEnum;
  proposalId: string;
  /** Used to confirm the transaction; the relayer pays and signs it. */
  publicClient?: ReceiptWaiter | null;
  onTxSubmitted: (hash: Hash) => void;
};

/**
 * Queue or execute a proposal through the relayer, which pays the gas. The
 * relayer verifies the proposal on-chain, simulates, and normally waits for
 * the receipt before answering, so the local receipt wait is usually instant
 * and only matters when the relayer's own wait timed out.
 *
 * Rejects only when the relayer answered with a definitive error: a
 * pre-broadcast rejection (nothing was sent, retrying is safe) or
 * TRANSACTION_REVERTED. Anything ambiguous is reported as an outcome.
 */
export const relayGovernanceAction = async ({
  action,
  daoId,
  proposalId,
  publicClient,
  onTxSubmitted,
}: RelayGovernanceActionParams): Promise<RelayOutcome> => {
  const daoKey = daoId.toLowerCase();

  let hash: Hash;
  try {
    const response =
      action === "queue"
        ? await relayQueue(daoKey as RelayQueuePathParamsDaoEnumKey, {
            proposalId,
          })
        : await relayExecute(daoKey as RelayExecutePathParamsDaoEnumKey, {
            proposalId,
          });
    hash = response.transactionHash as Hash;
  } catch (error) {
    if (
      isRelayerEnactmentRejection(error) ||
      isRelayerTransactionReverted(error)
    ) {
      throw error;
    }
    console.error(error);
    return { status: "unknown", hash: null };
  }

  onTxSubmitted(hash);

  if (!publicClient) return { hash, status: "unconfirmed" };

  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return {
      hash,
      status: receipt.status === "reverted" ? "reverted" : "success",
    };
  } catch (error) {
    console.error(error);
    return { hash, status: "unconfirmed" };
  }
};
