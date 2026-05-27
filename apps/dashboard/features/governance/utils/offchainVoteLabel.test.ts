import {
  getOffchainVoteFullLabel,
  presentOffchainVoteLabel,
} from "./offchainVoteLabel";

const choices = [
  "3 WGs + secretary (As-is)",
  "Metagov + Eco/PG + secretary",
  "Metagov + merged Eco/PG",
  "Metagov only",
  "DAO Coordination Layer",
];

describe("offchainVoteLabel", () => {
  it("joins multiple choice indices into a full label", () => {
    expect(getOffchainVoteFullLabel(["5", "4", "3", "2", "1"], choices)).toBe(
      choices.slice().reverse().join(", "),
    );
  });

  it("shows a short ranked summary with tooltip for multi-choice ranked votes", () => {
    const full = getOffchainVoteFullLabel(["5", "4", "3", "2", "1"], choices);
    const presentation = presentOffchainVoteLabel(full, "copeland");

    expect(presentation.display).toBe("Ranked (5 choices)");
    expect(presentation.full).toBe(full);
    expect(presentation.showTooltip).toBe(true);
  });

  it("keeps single-choice labels as-is", () => {
    const presentation = presentOffchainVoteLabel(choices[0]!, "single-choice");

    expect(presentation.display).toBe(choices[0]);
    expect(presentation.showTooltip).toBe(false);
  });
});
