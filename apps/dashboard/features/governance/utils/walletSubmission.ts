import type { Hash } from "viem";

/** The part of a transaction receipt this flow reads. */
export interface SubmissionReceipt {
  status: "success" | "reverted";
  transactionHash: Hash;
}

/**
 * Reported by the submit helper as it moves through the phases that matter
 * for classifying a failure.
 */
export interface SubmissionProgress {
  /**
   * Called immediately before the transaction is handed to the wallet.
   * Everything that fails before this point is provably pre-broadcast.
   */
  onSendAttempt: () => void;
  /** Called with the hash the wallet answered with. */
  onBroadcast: (hash: Hash) => void;
}

/** How far a submission got before it failed. */
export interface SubmissionReach {
  sendAttempted: boolean;
  hash: Hash | null;
}

/**
 * Whether a failure is proof that nothing reached the chain.
 *
 * The default answer is no. A send whose response was lost looks exactly like
 * a send that never happened, so ambiguity is the safe reading and a retry is
 * only offered where the failure positively rules a broadcast out.
 */
export type FailureClass = "pre-broadcast" | "ambiguous";

const MAX_CAUSE_DEPTH = 10;

/** EIP-1193: the user dismissed the wallet prompt. Nothing was sent. */
const USER_REJECTION_CODE = 4001;

const USER_REJECTION_NAMES = [
  "UserRejectedRequestError",
  "UserRejectedRequest",
];

/**
 * viem errors raised while preparing the request, before it is handed to the
 * provider. Reaching one of these in the send window still means nothing was
 * broadcast.
 */
const PRE_SEND_ERROR_NAMES = [
  "ChainMismatchError",
  "ChainNotFoundError",
  "ChainNotConfiguredError",
  "AccountNotFoundError",
  "InvalidAddressError",
  "InsufficientFundsError",
  "EstimateGasExecutionError",
  "IntrinsicGasTooLowError",
];

const readProperty = (value: unknown, key: string): unknown => {
  if (typeof value !== "object" || value === null) return undefined;
  if (!(key in value)) return undefined;
  return Reflect.get(value, key);
};

/** The error and its `cause` chain, outermost first. viem nests heavily. */
const causeChain = (error: unknown): unknown[] => {
  const chain: unknown[] = [];
  let current: unknown = error;

  while (current !== undefined && current !== null) {
    if (chain.length >= MAX_CAUSE_DEPTH) break;
    chain.push(current);
    current = readProperty(current, "cause");
  }

  return chain;
};

const matchesAnywhere = (
  error: unknown,
  test: (link: unknown) => boolean,
): boolean => causeChain(error).some(test);

const hasName = (link: unknown, names: string[]): boolean => {
  const name = readProperty(link, "name");
  return typeof name === "string" && names.includes(name);
};

export const isUserRejection = (error: unknown): boolean =>
  matchesAnywhere(error, (link) => {
    if (hasName(link, USER_REJECTION_NAMES)) return true;
    return readProperty(link, "code") === USER_REJECTION_CODE;
  });

export const isPreSendFailure = (error: unknown): boolean =>
  matchesAnywhere(error, (link) => hasName(link, PRE_SEND_ERROR_NAMES));

/**
 * The single place that decides whether a wallet failure may be retried.
 *
 * Reaching the send is what makes a failure ambiguous: the provider may have
 * broadcast `eth_sendTransaction` and lost the response, which is
 * indistinguishable from never having sent it.
 */
export const classifyWalletFailure = (
  error: unknown,
  { sendAttempted, hash }: SubmissionReach,
): FailureClass => {
  // The transaction was never handed to the wallet, so it cannot be anywhere.
  if (!sendAttempted) return "pre-broadcast";
  // The wallet answered with a hash, so the transaction exists and only
  // reading its receipt can have failed.
  if (hash !== null) return "ambiguous";
  // Inside the send window: retry only on a failure that rules out a send.
  if (isUserRejection(error)) return "pre-broadcast";
  if (isPreSendFailure(error)) return "pre-broadcast";
  return "ambiguous";
};

/**
 * What the dashboard knows once a wallet submission settles.
 *
 * - "success" / "reverted": the receipt was read.
 * - "ambiguous": the transaction may be on its way. `hash` is null when the
 *   send itself is in doubt. Never followed by a retry, which could send the
 *   same governor call twice.
 *
 * Rejects only on a failure classified as pre-broadcast, where the caller's
 * usual error path with its retry is correct.
 */
export type WalletSubmissionOutcome =
  | { status: "success" | "reverted"; hash: Hash }
  | { status: "ambiguous"; hash: Hash | null };

type SubmitWithProgress = (
  progress: SubmissionProgress,
) => Promise<SubmissionReceipt>;

export const runWalletSubmission = async (
  submit: SubmitWithProgress,
): Promise<WalletSubmissionOutcome> => {
  // Held in an object so what the callbacks recorded is still visible to the
  // catch block below.
  const reach: SubmissionReach = { sendAttempted: false, hash: null };

  try {
    const receipt = await submit({
      onSendAttempt: () => {
        reach.sendAttempted = true;
      },
      onBroadcast: (hash) => {
        reach.hash = hash;
      },
    });
    return {
      status: receipt.status === "reverted" ? "reverted" : "success",
      hash: receipt.transactionHash,
    };
  } catch (error) {
    if (classifyWalletFailure(error, reach) === "pre-broadcast") throw error;
    console.error(error);
    return { status: "ambiguous", hash: reach.hash };
  }
};
