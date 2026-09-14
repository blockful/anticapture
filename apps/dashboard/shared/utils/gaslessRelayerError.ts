import { formatUnits } from "viem";
import type { Hash } from "viem";

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
): {
  code: string | undefined;
  message: string | undefined;
  status: number | undefined;
} => {
  const relayerError = error as
    | ResponseErrorConfig<ErrorResponse | RelayerErrorResponse>
    | undefined;
  const data: unknown = relayerError?.response?.data;
  // A proxy, CDN or crashed upstream can answer with an HTML or plain-text
  // page, which the client stores as a string; `"code" in string` throws.
  // Such a body carries no relayer code, so the failure stays ambiguous.
  const isStructured = typeof data === "object" && data !== null;
  const code =
    isStructured && "code" in data
      ? (data as RelayerErrorResponse).code
      : undefined;
  const message =
    isStructured && "error" in data ? (data as ErrorResponse).error : undefined;
  return { code, message, status: relayerError?.status };
};

export type RelayerEnactmentAction = "queue" | "execute";

export const getRelayerErrorCode = (error: unknown): string | undefined =>
  readRelayerError(error).code;

/**
 * Every code the relayer can answer with before it signs anything, mirroring
 * `Errors` in `apps/relayer/src/errors.ts`. All of them mean no transaction
 * was broadcast, so retrying is safe. The two 503s are in here for that
 * reason: a low balance or an unreachable rate limiter are structured "did
 * not send" answers, not the ambiguous 5xx they look like from the status
 * alone. `TRANSACTION_REVERTED` is deliberately absent, being the one code
 * that reports a transaction the relayer did broadcast.
 */
const ENACTMENT_REJECTION_CODES = new Set([
  "INSUFFICIENT_VOTING_POWER",
  "INVALID_SIGNATURE",
  "RATE_LIMITED",
  "RELAYER_LOW_BALANCE",
  "INVALID_CONTRACT",
  "RATE_LIMITER_UNAVAILABLE",
  "PROPOSAL_NOT_FOUND",
  "PROPOSAL_DATA_MISMATCH",
  "INVALID_PROPOSAL_STATE",
  "TIMELOCK_NOT_READY",
  "SIMULATION_FAILED",
]);

/** The relayer broadcast the transaction and saw it revert: a final answer. */
export const isRelayerTransactionReverted = (error: unknown): boolean =>
  getRelayerErrorCode(error) === "TRANSACTION_REVERTED";

const TX_HASH_PATTERN = /0x[0-9a-fA-F]{64}/;

/**
 * The relayer reports a reverted transaction in the message rather than in a
 * field of its own, so the hash is read back out of it. That gives the modal
 * the same explorer link the wallet path shows for a revert.
 */
export const getRelayerRevertedHash = (error: unknown): Hash | null => {
  if (!isRelayerTransactionReverted(error)) return null;
  const match = readRelayerError(error).message?.match(TX_HASH_PATTERN);
  return match ? (match[0] as Hash) : null;
};

/**
 * How much a relayer failure says about whether a transaction exists.
 *
 * - "pre-broadcast": the relayer or the gateway refused the request. Nothing
 *   was signed, so the caller may offer a retry.
 * - "reverted": the relayer broadcast it and saw it fail. Also final.
 * - "ambiguous": a 5xx with no structured code, a timeout, or a transport
 *   failure. Gateful aborts the proxy after 30s while the relayer may still
 *   be waiting for its receipt, so the transaction may well be on its way.
 */
export type RelayerFailureClass = "pre-broadcast" | "reverted" | "ambiguous";

export const classifyRelayerFailure = (error: unknown): RelayerFailureClass => {
  const { code, status } = readRelayerError(error);

  if (code === "TRANSACTION_REVERTED") return "reverted";
  if (code !== undefined && ENACTMENT_REJECTION_CODES.has(code)) {
    return "pre-broadcast";
  }
  // Gateful answers 400 or 404 with an `error` string and no relayer code
  // when the DAO or its relayer is unknown, and its request validation does
  // the same. Any 4xx is a refusal to act on the request, so nothing was sent.
  if (status !== undefined && status >= 400 && status < 500) {
    return "pre-broadcast";
  }
  // Everything left is a 5xx with no code this file knows, a timeout, or a
  // transport failure, and none of them says whether a transaction exists.
  // The default is deliberately the cautious one: a relayer code added over
  // there and not here lands in this branch and costs the user a retry, which
  // is the cheaper mistake than offering one that duplicates a governor call.
  return "ambiguous";
};

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
