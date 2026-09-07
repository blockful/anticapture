import { formatUnits } from "viem";

import type {
  ErrorResponse,
  RelayerErrorResponse,
  ResponseErrorConfig,
} from "@anticapture/client";

const INSUFFICIENT_VOTING_POWER = "INSUFFICIENT_VOTING_POWER";
const RATE_LIMITED = "RATE_LIMITED";

const GENERIC_MESSAGE =
  "Something went wrong with your operation. Try again later";
const RATE_LIMITED_MESSAGE =
  "You've reached the maximum operations for this month";

const formatThreshold = (raw: bigint, decimals: number, symbol: string) =>
  `${formatUnits(raw, decimals)} ${symbol}`;

const readRelayerError = (
  error: unknown,
): { code: string | undefined; status: number | undefined } => {
  const relayerError = error as
    | ResponseErrorConfig<ErrorResponse | RelayerErrorResponse>
    | undefined;
  const data = relayerError?.response?.data;
  const code =
    data && "code" in data ? (data as RelayerErrorResponse).code : undefined;
  return { code, status: relayerError?.status };
};

export type RelayerEnactmentAction = "queue" | "execute";

export const getRelayerErrorCode = (error: unknown): string | undefined =>
  readRelayerError(error).code;

/**
 * Codes the relayer returns before it signs anything for queue()/execute().
 * Any of these means no transaction was broadcast, so retrying is safe. A
 * failure without one of these codes (network error, gateway timeout, plain
 * 5xx) says nothing about whether the relayer already sent the transaction:
 * Gateful aborts the proxy after 30s while the relayer is still waiting for
 * the receipt, so the caller must treat that case as unknown, not as failed.
 */
const ENACTMENT_REJECTION_CODES = new Set([
  "INVALID_PROPOSAL_STATE",
  "TIMELOCK_NOT_READY",
  "SIMULATION_FAILED",
  "PROPOSAL_NOT_FOUND",
  "PROPOSAL_DATA_MISMATCH",
  "RELAYER_LOW_BALANCE",
]);

export const isRelayerEnactmentRejection = (error: unknown): boolean => {
  const code = getRelayerErrorCode(error);
  return code !== undefined && ENACTMENT_REJECTION_CODES.has(code);
};

/** The relayer broadcast the transaction and saw it revert: a final answer. */
export const isRelayerTransactionReverted = (error: unknown): boolean =>
  getRelayerErrorCode(error) === "TRANSACTION_REVERTED";

/**
 * Relayer failures for the permissionless queue()/execute() calls, keyed by
 * the `code` the relayer returns. These are proposal-state problems rather
 * than something about the user's wallet, so the copy says what is wrong
 * with the proposal and, where useful, what to do instead.
 */
const ENACTMENT_MESSAGES: Record<
  string,
  (action: RelayerEnactmentAction) => string
> = {
  INVALID_PROPOSAL_STATE: (action) =>
    action === "queue"
      ? "This proposal can't be queued right now. Only succeeded proposals can be queued."
      : "This proposal can't be executed right now. Only queued proposals can be executed.",
  TIMELOCK_NOT_READY: () =>
    "The timelock delay has not passed yet. Try again once the proposal is ready to execute.",
  SIMULATION_FAILED: (action) =>
    `This proposal can't be ${action}d on-chain: its transactions would revert. No gas was spent.`,
  TRANSACTION_REVERTED: (action) =>
    `The ${action} transaction was mined but reverted on-chain.`,
  PROPOSAL_NOT_FOUND: () => "The relayer could not find this proposal.",
  PROPOSAL_DATA_MISMATCH: () =>
    "The proposal data doesn't match what is on-chain, so the relayer refused to submit it.",
  RELAYER_LOW_BALANCE: () =>
    "The relayer is out of funds right now. You can still complete this action with your own wallet.",
};

export const mapRelayerEnactmentError = (
  error: unknown,
  action: RelayerEnactmentAction,
): string => {
  const code = getRelayerErrorCode(error);
  const message = code ? ENACTMENT_MESSAGES[code] : undefined;
  if (message) return message(action);
  return `The relayer could not ${action} this proposal. You can retry or use your own wallet.`;
};

export const mapRelayerError = (
  error: unknown,
  context: {
    operation: "vote" | "delegate";
    minVotingPower: bigint | null;
    decimals: number;
    symbol: string;
  },
): string => {
  const { code, status } = readRelayerError(error);

  if (code === INSUFFICIENT_VOTING_POWER) {
    if (context.minVotingPower === null) {
      return `You don't have sufficient voting power to ${context.operation}.`;
    }
    const formatted = formatThreshold(
      context.minVotingPower,
      context.decimals,
      context.symbol,
    );
    return `You don't have sufficient voting power to ${context.operation}. You need minimum ${formatted}`;
  }

  if (code === RATE_LIMITED || status === 429) {
    return RATE_LIMITED_MESSAGE;
  }

  return GENERIC_MESSAGE;
};

export const isUserRejection = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /rejected|denied|user (denied|rejected)/i.test(message);
};
