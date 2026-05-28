/**
 * Snapshot proposal `type` strings we receive from the API/indexer.
 * Some types (e.g. copeland) use ranked ballots but are not listed in @snapshot-labs/snapshot.js types.
 */

/** UI + validation: which vote-options component to render. */
export type OffchainVoteUiType =
  | "basic"
  | "single-choice"
  | "approval"
  | "ranked-choice"
  | "weighted"
  | "quadratic";

const UI_TYPE_ALIASES: Record<string, OffchainVoteUiType> = {
  copeland: "ranked-choice",
};

export const getOffchainVoteUiType = (
  proposalType: string,
): OffchainVoteUiType | null => {
  const normalized = UI_TYPE_ALIASES[proposalType] ?? proposalType;
  switch (normalized) {
    case "basic":
    case "single-choice":
    case "approval":
    case "ranked-choice":
    case "weighted":
    case "quadratic":
      return normalized;
    default:
      return null;
  }
};

/** EIP-712 signing: snapshot.js only uses voteArrayTypes for approval + ranked-choice. */
export const getSnapshotVoteSignType = (
  proposalType: string,
): OffchainVoteUiType => getOffchainVoteUiType(proposalType) ?? "single-choice";

export const usesRankedBallot = (proposalType: string): boolean =>
  getOffchainVoteUiType(proposalType) === "ranked-choice";
