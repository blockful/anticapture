import type { Hash, PublicClient } from "viem";

import { relayExecute, relayQueue } from "@anticapture/client";
import type {
  RelayExecutePathParamsDaoEnumKey,
  RelayQueuePathParamsDaoEnumKey,
} from "@anticapture/client";

import type { GovernanceAction } from "@/features/governance/utils/submitGovernanceAction";
import type { DaoIdEnum } from "@/shared/types/daos";

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

/**
 * What the dashboard knows about the relayed transaction once the call
 * returns. "unconfirmed" means the hash exists but the local receipt check
 * could not run or timed out, so the caller must not treat the action as
 * either done or failed.
 */
export type RelayOutcome = {
  hash: Hash;
  status: "success" | "reverted" | "unconfirmed";
};

type RelayGovernanceActionParams = {
  action: GovernanceAction;
  daoId: DaoIdEnum;
  proposalId: string;
  /** Used to confirm the transaction; the relayer pays and signs it. */
  publicClient?: PublicClient | null;
  onTxSubmitted: (hash: Hash) => void;
};

/**
 * Queue or execute a proposal through the relayer, which pays the gas. The
 * relayer verifies the proposal on-chain, simulates, and normally waits for
 * the receipt before answering, so the local receipt wait is usually instant
 * and only matters when the relayer's own wait timed out. A rejection from
 * this function always means nothing was broadcast; anything after the hash
 * is returned is reported through the outcome instead.
 */
export const relayGovernanceAction = async ({
  action,
  daoId,
  proposalId,
  publicClient,
  onTxSubmitted,
}: RelayGovernanceActionParams): Promise<RelayOutcome> => {
  const daoKey = daoId.toLowerCase();
  const response =
    action === "queue"
      ? await relayQueue(daoKey as RelayQueuePathParamsDaoEnumKey, {
          proposalId,
        })
      : await relayExecute(daoKey as RelayExecutePathParamsDaoEnumKey, {
          proposalId,
        });

  const hash = response.transactionHash as Hash;
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
