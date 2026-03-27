import { ProposalStatus } from "@/features/governance/types";

export const getOffchainProposalStatus = (
  state: string,
  type: string,
  scores: Array<number | null>,
): ProposalStatus => {
  if (state === "active") return ProposalStatus.ONGOING;
  if (state === "pending") return ProposalStatus.PENDING;

  // Non-basic proposals (elections, polls, etc.): voting concluded = closed
  if (type !== "basic") return ProposalStatus.CLOSED;

  const for_ = scores[0] ?? 0;
  const against = scores[1] ?? 0;

  if (for_ > against) return ProposalStatus.EXECUTED;
  return ProposalStatus.DEFEATED;
};

export const normalizeChoices = (
  choices: Array<string | null> | null | undefined,
): string[] => (choices ?? []).filter((c): c is string => c !== null);

export const normalizeScores = (
  scores: Array<number | null> | null | undefined,
): number[] => (scores ?? []).map((s) => s ?? 0);
