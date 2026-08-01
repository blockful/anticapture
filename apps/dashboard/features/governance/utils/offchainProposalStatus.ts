/**
 * Off-chain (Snapshot) proposal status derivation.
 *
 * Mirrors snapshot.box's `getProposalState` (sx-monorepo offchain API): exactly
 * five states, where passed/rejected exist ONLY for basic (For/Against/Abstain)
 * proposals and are quorum-aware. Every other vote type simply closes, and we
 * surface the winner alongside it. An off-chain proposal is never "executed" —
 * that label leaking in from the on-chain enum is the bug this replaces.
 */

export type OffchainProposalStatus =
  | "pending"
  | "active"
  | "passed"
  | "rejected"
  | "closed";

/** Snapshot choice order for basic ballots. */
const FOR = 0;
const AGAINST = 1;

/** Vote types whose outcome is a winner, not a pass/fail verdict. */
const isBasicVote = (type: string) => type === "basic";

export interface OffchainProposalStatusInput {
  /** Snapshot proposal type ("basic", "approval", "ranked-choice", ...). */
  type: string;
  /** Voting window, in Unix seconds. */
  start: number;
  end: number;
  /** Per-choice voting power, aligned with `choices`. */
  scores: number[];
  /**
   * Snapshot's `scores_total`: the distinct voting power that took part. It is
   * the turnout denominator, and only equals the sum of `scores` for ballots
   * where each voter backs a single choice — on an approval vote a voter's
   * power lands on every option they approve, so summing double-counts it.
   */
  scoresTotal?: number;
  choices: string[];
  /**
   * Space quorum. Undefined or 0 means the space sets no quorum, so the
   * For/Against comparison alone decides the outcome.
   */
  quorum?: number;
  /**
   * Snapshot's `quorumType`. "rejection" inverts the test: quorum is measured
   * against the Against side, so exceeding it rejects the proposal.
   */
  quorumType?: string | null;
  /** Injectable clock, in ms, for deterministic tests. */
  now?: number;
}

export interface OffchainProposalStatusResult {
  status: OffchainProposalStatus;
  /** Winner + share, for the "winner: X · NN%" copy on closed non-basic votes. */
  winner?: { label: string; percent: number };
}

const resolveWinner = (choices: string[], scores: number[], total: number) => {
  if (total <= 0) return undefined;

  let bestIndex = 0;
  for (let i = 1; i < scores.length; i += 1) {
    if ((scores[i] ?? 0) > (scores[bestIndex] ?? 0)) bestIndex = i;
  }

  const label = choices[bestIndex];
  if (label === undefined) return undefined;

  return { label, percent: ((scores[bestIndex] ?? 0) / total) * 100 };
};

export const getOffchainProposalStatus = ({
  type,
  start,
  end,
  scores,
  scoresTotal,
  choices,
  quorum,
  quorumType,
  now = Date.now(),
}: OffchainProposalStatusInput): OffchainProposalStatusResult => {
  const nowSeconds = now / 1000;

  if (nowSeconds < start) return { status: "pending" };
  if (nowSeconds < end) return { status: "active" };

  // Falls back to the sum for proposals indexed before scores_total existed.
  const total =
    scoresTotal && scoresTotal > 0
      ? scoresTotal
      : scores.reduce((sum, score) => sum + score, 0);

  // Voting has ended.
  if (!isBasicVote(type)) {
    return { status: "closed", winner: resolveWinner(choices, scores, total) };
  }

  const forVotes = scores[FOR] ?? 0;
  const againstVotes = scores[AGAINST] ?? 0;
  const hasQuorum = quorum !== undefined && quorum > 0;

  // Rejection-type quorum: reaching it is what rejects the proposal.
  if (hasQuorum && quorumType === "rejection") {
    if (againstVotes >= quorum) return { status: "rejected" };
    return { status: forVotes > againstVotes ? "passed" : "rejected" };
  }

  if (hasQuorum && total < quorum) return { status: "rejected" };

  // Ties reject: passing requires strictly more For than Against.
  return { status: forVotes > againstVotes ? "passed" : "rejected" };
};

/** Human label for each status, per the final badge frame. */
export const OFFCHAIN_STATUS_LABEL: Record<OffchainProposalStatus, string> = {
  pending: "Pending",
  active: "Active",
  passed: "Passed",
  rejected: "Rejected",
  closed: "Closed",
};
