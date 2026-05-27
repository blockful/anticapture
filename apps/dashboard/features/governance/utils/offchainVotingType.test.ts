import {
  getOffchainVoteUiType,
  getSnapshotVoteSignType,
  usesRankedBallot,
} from "./offchainVotingType";

describe("offchainVotingType", () => {
  it("maps copeland to ranked-choice UI", () => {
    expect(getOffchainVoteUiType("copeland")).toBe("ranked-choice");
    expect(usesRankedBallot("copeland")).toBe(true);
  });

  it("signs copeland votes as ranked-choice for snapshot.js", () => {
    expect(getSnapshotVoteSignType("copeland")).toBe("ranked-choice");
  });

  it("passes through known types", () => {
    expect(getOffchainVoteUiType("single-choice")).toBe("single-choice");
    expect(getSnapshotVoteSignType("approval")).toBe("approval");
    expect(usesRankedBallot("ranked-choice")).toBe(true);
  });

  it("falls back to single-choice for unknown types when signing", () => {
    expect(getSnapshotVoteSignType("unknown-plugin-type")).toBe(
      "single-choice",
    );
  });

  it("returns null for unsupported UI types", () => {
    expect(getOffchainVoteUiType("unknown-plugin-type")).toBeNull();
  });
});
