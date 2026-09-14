import type { Hash } from "viem";

/** The part of a transaction receipt this flow reads. */
export interface SubmissionReceipt {
  status: "success" | "reverted";
  transactionHash: Hash;
}

/**
 * Runs a wallet submission and reports the hash alongside the outcome.
 *
 * - "success" / "reverted": the receipt was read.
 * - "unconfirmed": the wallet broadcast the transaction but waiting for its
 *   receipt failed, typically an RPC timeout or a dropped connection. The
 *   governance call may still land, so this is neither a success nor a
 *   failure and must never be followed by a retry that could send the same
 *   call twice.
 *
 * Rejects only when nothing reached the chain: a rejected signature or a
 * simulation revert happens before any broadcast, so retrying is safe there
 * and the caller keeps its usual error path.
 */
export type WalletSubmissionOutcome = {
  status: "success" | "reverted" | "unconfirmed";
  hash: Hash;
};

type SubmitWithBroadcast = (
  onBroadcast: (hash: Hash) => void,
) => Promise<SubmissionReceipt>;

export const runWalletSubmission = async (
  submit: SubmitWithBroadcast,
): Promise<WalletSubmissionOutcome> => {
  // Held in an object so the hash recorded by the callback is still visible
  // to the catch block below.
  const broadcast: { hash: Hash | null } = { hash: null };

  try {
    const receipt = await submit((hash) => {
      broadcast.hash = hash;
    });
    return {
      status: receipt.status === "reverted" ? "reverted" : "success",
      hash: receipt.transactionHash,
    };
  } catch (error) {
    if (broadcast.hash === null) throw error;
    console.error(error);
    return { status: "unconfirmed", hash: broadcast.hash };
  }
};
