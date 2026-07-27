import { ProposalStatus } from "@/features/governance/types";

import { getOffchainProposalStatusView } from "./offchainProposal";

const CLOSED_WINDOW = { start: 1_000, end: 2_000 };

describe("getOffchainProposalStatusView", () => {
  const basicClosed = (scores: number[]) =>
    getOffchainProposalStatusView({
      type: "basic",
      ...CLOSED_WINDOW,
      scores,
      choices: ["For", "Against", "Abstain"],
    });

  // The regression this replaces: a passing Snapshot basic vote used to map to
  // ProposalStatus.EXECUTED, which rendered as "Executed" on a proposal that
  // was never executed anywhere.
  it("maps a passing basic proposal to PASSED, never EXECUTED", () => {
    const { status } = basicClosed([70, 30, 0]);
    expect(status).toBe(ProposalStatus.PASSED);
    expect(status).not.toBe(ProposalStatus.EXECUTED);
  });

  it("maps a failing basic proposal to REJECTED", () => {
    expect(basicClosed([30, 70, 0]).status).toBe(ProposalStatus.REJECTED);
  });

  it("maps non-basic vote types to CLOSED and surfaces the winner", () => {
    const { status, winner } = getOffchainProposalStatusView({
      type: "approval",
      ...CLOSED_WINDOW,
      scores: [10, 60, 30],
      choices: ["Alpha", "Beta", "Gamma"],
    });
    expect(status).toBe(ProposalStatus.CLOSED);
    expect(winner).toEqual({ label: "Beta", percent: 60 });
  });

  it("maps an open proposal to ONGOING and an unstarted one to PENDING", () => {
    const now = Date.now();
    expect(
      getOffchainProposalStatusView({
        type: "basic",
        start: Math.floor(now / 1000) - 10,
        end: Math.floor(now / 1000) + 10_000,
        scores: [1, 0, 0],
        choices: ["For", "Against", "Abstain"],
      }).status,
    ).toBe(ProposalStatus.ONGOING);

    expect(
      getOffchainProposalStatusView({
        type: "basic",
        start: Math.floor(now / 1000) + 10_000,
        end: Math.floor(now / 1000) + 20_000,
        scores: [0, 0, 0],
        choices: ["For", "Against", "Abstain"],
      }).status,
    ).toBe(ProposalStatus.PENDING);
  });

  it("tolerates null entries in scores and choices", () => {
    const { status } = getOffchainProposalStatusView({
      type: "basic",
      ...CLOSED_WINDOW,
      scores: [70, null, null],
      choices: ["For", null, "Abstain"],
    });
    expect(status).toBe(ProposalStatus.PASSED);
  });
});
