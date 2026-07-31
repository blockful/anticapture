import { getOffchainVoteUiType } from "@/features/governance/utils/offchainVotingType";

/**
 * Per-choice share of a cast vote, as percentages aligned with `choices`.
 *
 * Only share-based ballots have a meaningful answer. Approval and ranked votes
 * are not shares (approval applies the full voting power to every approved
 * option; ranked encodes an order), so they return null and the voted modal
 * lists the chosen options instead of drawing bars.
 *
 * Weighted and quadratic weights are not recoverable either: the API models
 * `choice` as an array of choice indices, dropping the per-option weights
 * Snapshot stores. Callers pass those in explicitly when they have them.
 */
export const deriveOffchainVoteWeights = (
  choice: string[],
  choices: string[],
  proposalType: string,
): number[] | null => {
  const uiType = getOffchainVoteUiType(proposalType);
  if (uiType !== "basic" && uiType !== "single-choice") return null;

  const chosen = Number(choice[0]);
  if (!Number.isFinite(chosen)) return null;

  return choices.map((_, index) => (index === chosen - 1 ? 100 : 0));
};

/** Choice labels a vote selected, in the order the voter submitted them. */
export const getOffchainVoteChoiceLabels = (
  choice: string[],
  choices: string[],
): string[] =>
  choice
    .map((raw) => {
      const index = Number(raw);
      if (!Number.isFinite(index)) return null;
      return choices[index - 1] ?? `Choice ${raw}`;
    })
    .filter((label): label is string => label !== null);
