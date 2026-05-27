import {
  getOffchainVoteUiType,
  type OffchainVoteUiType,
} from "@/features/governance/utils/offchainVotingType";

export interface OffchainVoteLabelPresentation {
  display: string;
  full: string;
  showTooltip: boolean;
}

/** Builds a human-readable label from Snapshot `choice` indices and proposal choices. */
export const getOffchainVoteFullLabel = (
  choice: string[],
  choices: string[],
): string => {
  if (choice.length === 0) return "";

  if (choice.length === 1 && choice[0] != null) {
    const idx = Number(choice[0]);
    return choices[idx - 1] ?? `Choice ${choice[0]}`;
  }

  return choice
    .filter((c): c is string => c != null)
    .map((c) => {
      const idx = Number(c);
      return choices[idx - 1] ?? `Choice ${c}`;
    })
    .join(", ");
};

export const presentOffchainVoteLabel = (
  fullLabel: string,
  proposalType: string | null | undefined,
): OffchainVoteLabelPresentation => {
  if (!fullLabel) {
    return { display: "", full: "", showTooltip: false };
  }

  const uiType: OffchainVoteUiType | null = proposalType
    ? getOffchainVoteUiType(proposalType)
    : null;

  if (uiType === "ranked-choice") {
    const rankedChoices = fullLabel.split(", ");
    if (rankedChoices.length > 1) {
      return {
        display: `Ranked (${rankedChoices.length} choices)`,
        full: fullLabel,
        showTooltip: true,
      };
    }
  }

  if (uiType === "approval") {
    const approved = fullLabel.split(", ");
    if (approved.length > 1) {
      return {
        display: `${approved.length} options approved`,
        full: fullLabel,
        showTooltip: true,
      };
    }
  }

  if (uiType === "weighted" || uiType === "quadratic") {
    if (fullLabel.length > 40 || fullLabel.includes(", ")) {
      return {
        display: "Split vote",
        full: fullLabel,
        showTooltip: true,
      };
    }
  }

  if (fullLabel.length > 40) {
    return {
      display: `${fullLabel.slice(0, 37)}…`,
      full: fullLabel,
      showTooltip: true,
    };
  }

  return { display: fullLabel, full: fullLabel, showTooltip: false };
};
