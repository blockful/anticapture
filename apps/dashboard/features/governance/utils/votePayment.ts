/**
 * Who pays for a vote, and what the ballot says about it.
 *
 * The relayer is a convenience and the wallet is the guarantee: every state
 * in which the relayer cannot be trusted with this ballot resolves to the
 * wallet, and the ballot always says why, so a voter is never left with a
 * Submit button that keeps failing on the same broken path.
 *
 * - "relayer-unavailable": the status endpoint did not answer `available:
 *   true` (paused, unfunded, RPC down, relayer unreachable, ...).
 * - "gasless-failed": a relay attempt from this ballot was refused before
 *   anything was broadcast, or the relayer never confirmed it and the chain
 *   shows no vote. The relayer may be fine for others, but this voter has
 *   seen it fail, so offering it again would only fail again.
 * - "wallet-chosen": the voter opted out of the relayer themselves.
 * - "comment": `castVoteBySig` carries no reason, so a comment needs the
 *   wallet's `castVoteWithReason`.
 * - "none": the DAO has no relayer, or this voter is not eligible for it
 *   (voting power, monthly limit). Nothing went wrong, so nothing is said.
 */
export type WalletVoteReason =
  | "relayer-unavailable"
  | "gasless-failed"
  | "wallet-chosen"
  | "comment"
  | "none";

export type VotePayment =
  | { mode: "gasless" }
  | { mode: "wallet"; reason: WalletVoteReason };

interface VotePaymentInput {
  /** The DAO is configured with a gasless relayer at all. */
  daoHasRelayer: boolean;
  /** The relayer status answer: null while it loads. */
  isRelayerAvailable: boolean | null;
  /** Voting power and monthly limit allow a relayed vote for this voter. */
  isEligible: boolean;
  hasComment: boolean;
  gaslessFailed: boolean;
  prefersWallet: boolean;
}

export const getVotePayment = ({
  daoHasRelayer,
  isRelayerAvailable,
  isEligible,
  hasComment,
  gaslessFailed,
  prefersWallet,
}: VotePaymentInput): VotePayment => {
  if (!daoHasRelayer) return { mode: "wallet", reason: "none" };
  if (gaslessFailed) return { mode: "wallet", reason: "gasless-failed" };
  if (isRelayerAvailable === false) {
    return { mode: "wallet", reason: "relayer-unavailable" };
  }
  // Still loading, or not eligible: the wallet works either way, and holding
  // the ballot until the relayer answers would make voting depend on it.
  if (isRelayerAvailable === null || !isEligible) {
    return { mode: "wallet", reason: "none" };
  }
  if (hasComment) return { mode: "wallet", reason: "comment" };
  if (prefersWallet) return { mode: "wallet", reason: "wallet-chosen" };
  return { mode: "gasless" };
};

/**
 * Whether the voter can switch back to the relayer from where they are: only
 * when they left it by choice. A failed or unavailable relayer is not
 * offered again from the same ballot.
 */
export const canReturnToGasless = (payment: VotePayment): boolean =>
  payment.mode === "wallet" && payment.reason === "wallet-chosen";

/**
 * The Submit label. A DAO with a relayer has two ways to vote, so the button
 * names the one it will use whenever it is the wallet; a DAO without one
 * keeps the plain label it always had.
 */
export const getSubmitLabel = (
  payment: VotePayment,
  daoHasRelayer: boolean,
): string => {
  if (payment.mode === "gasless") return "Submit gas-free";
  return daoHasRelayer ? "Vote with wallet" : "Submit";
};
