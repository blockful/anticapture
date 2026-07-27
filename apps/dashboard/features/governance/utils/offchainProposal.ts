import { ProposalStatus } from "@/features/governance/types";
import {
  getOffchainProposalStatus as deriveOffchainStatus,
  type OffchainProposalStatus,
  type OffchainProposalStatusResult,
} from "@/features/governance/utils/offchainProposalStatus";

/** Off-chain statuses have no on-chain equivalent for passed/rejected. */
const STATUS_TO_PROPOSAL_STATUS: Record<
  OffchainProposalStatus,
  ProposalStatus
> = {
  pending: ProposalStatus.PENDING,
  active: ProposalStatus.ONGOING,
  passed: ProposalStatus.PASSED,
  rejected: ProposalStatus.REJECTED,
  closed: ProposalStatus.CLOSED,
};

export interface OffchainProposalStatusViewInput {
  type: string;
  start: number;
  end: number;
  scores: Array<number | null>;
  choices: Array<string | null>;
  quorum?: number;
  quorumType?: string | null;
}

/**
 * Page-facing off-chain status. Delegates the derivation to the shared
 * quorum-aware logic and maps it onto the view enum, so a Snapshot proposal can
 * never render as "Executed" — which is what this used to return whenever a
 * basic ballot had more For than Against.
 */
export const getOffchainProposalStatusView = (
  input: OffchainProposalStatusViewInput,
): {
  status: ProposalStatus;
  winner: OffchainProposalStatusResult["winner"];
} => {
  const { status, winner } = deriveOffchainStatus({
    type: input.type,
    start: input.start,
    end: input.end,
    scores: normalizeScores(input.scores),
    choices: normalizeChoices(input.choices),
    quorum: input.quorum,
    quorumType: input.quorumType,
  });

  return { status: STATUS_TO_PROPOSAL_STATUS[status], winner };
};

export const normalizeChoices = (
  choices: Array<string | null> | null | undefined,
): string[] => (choices ?? []).filter((c): c is string => c !== null);

export const normalizeScores = (
  scores: Array<number | null> | null | undefined,
): number[] => (scores ?? []).map((s) => s ?? 0);
