import {
  getOffchainProposalStatus,
  type OffchainProposalStatusInput,
} from "./offchainProposalStatus";

const START = 1_000;
const END = 2_000;
/** Injected clock values, in ms, on either side of the voting window. */
const BEFORE_START = 500 * 1000;
const DURING = 1_500 * 1000;
const AFTER_END = 2_500 * 1000;

const basic = (
  overrides: Partial<OffchainProposalStatusInput> = {},
): OffchainProposalStatusInput => ({
  type: "basic",
  start: START,
  end: END,
  choices: ["For", "Against", "Abstain"],
  scores: [0, 0, 0],
  now: AFTER_END,
  ...overrides,
});

describe("getOffchainProposalStatus", () => {
  // Derivation table, frame 12.
  it("not started -> pending", () => {
    expect(getOffchainProposalStatus(basic({ now: BEFORE_START })).status).toBe(
      "pending",
    );
  });

  it("voting open -> active", () => {
    expect(getOffchainProposalStatus(basic({ now: DURING })).status).toBe(
      "active",
    );
  });

  it("basic, quorum met, For > Against -> passed", () => {
    expect(
      getOffchainProposalStatus(basic({ scores: [70, 30, 0], quorum: 100 }))
        .status,
    ).toBe("passed");
  });

  it("basic, quorum met, Against >= For -> rejected", () => {
    expect(
      getOffchainProposalStatus(basic({ scores: [30, 70, 0], quorum: 100 }))
        .status,
    ).toBe("rejected");
  });

  it("basic, quorum met, exact tie -> rejected", () => {
    expect(
      getOffchainProposalStatus(basic({ scores: [50, 50, 0], quorum: 100 }))
        .status,
    ).toBe("rejected");
  });

  it("basic, below quorum -> rejected even when For leads", () => {
    expect(
      getOffchainProposalStatus(basic({ scores: [70, 30, 0], quorum: 1_000 }))
        .status,
    ).toBe("rejected");
  });

  it("basic, rejection-quorum exceeded -> rejected (inverted test)", () => {
    expect(
      getOffchainProposalStatus(
        basic({
          // For leads and total clears quorum, but Against alone reaches it.
          scores: [500, 100, 0],
          quorum: 100,
          quorumType: "rejection",
        }),
      ).status,
    ).toBe("rejected");
  });

  it("basic, rejection-quorum not exceeded -> falls back to For vs Against", () => {
    expect(
      getOffchainProposalStatus(
        basic({ scores: [500, 99, 0], quorum: 100, quorumType: "rejection" }),
      ).status,
    ).toBe("passed");
  });

  it("basic with no quorum configured -> For vs Against decides", () => {
    expect(getOffchainProposalStatus(basic({ scores: [1, 0, 0] })).status).toBe(
      "passed",
    );
    expect(getOffchainProposalStatus(basic({ scores: [0, 1, 0] })).status).toBe(
      "rejected",
    );
  });

  it.each(["approval", "ranked-choice", "weighted", "quadratic"])(
    "%s, ended -> closed with a winner",
    (type) => {
      const result = getOffchainProposalStatus({
        type,
        start: START,
        end: END,
        choices: ["Alpha", "Beta", "Gamma"],
        scores: [10, 60, 30],
        now: AFTER_END,
      });
      expect(result.status).toBe("closed");
      expect(result.winner).toEqual({ label: "Beta", percent: 60 });
    },
  );

  it("never derives an executed state for any vote type", () => {
    const statuses = [
      "basic",
      "approval",
      "ranked-choice",
      "weighted",
      "quadratic",
      "single-choice",
    ].map(
      (type) =>
        getOffchainProposalStatus({
          type,
          start: START,
          end: END,
          choices: ["A", "B"],
          scores: [2, 1],
          now: AFTER_END,
        }).status,
    );
    expect(statuses).not.toContain("executed");
    statuses.forEach((status) =>
      expect(["pending", "active", "passed", "rejected", "closed"]).toContain(
        status,
      ),
    );
  });

  it("approval, uses scoresTotal as the turnout denominator", () => {
    // Every voter approved two of the three options, so the scores sum to twice
    // the voting power that actually took part.
    const result = getOffchainProposalStatus({
      type: "approval",
      start: START,
      end: END,
      choices: ["Alpha", "Beta", "Gamma"],
      scores: [100, 60, 40],
      scoresTotal: 100,
      now: AFTER_END,
    });
    expect(result.winner).toEqual({ label: "Alpha", percent: 100 });
  });

  it("omits the winner when a closed proposal has no votes", () => {
    const result = getOffchainProposalStatus({
      type: "approval",
      start: START,
      end: END,
      choices: ["A", "B"],
      scores: [0, 0],
      now: AFTER_END,
    });
    expect(result.status).toBe("closed");
    expect(result.winner).toBeUndefined();
  });

  it("resolves the winner on a shuttered proposal only once revealed", () => {
    const revealed = getOffchainProposalStatus({
      type: "ranked-choice",
      start: START,
      end: END,
      choices: ["A", "B"],
      scores: [1, 4],
      now: AFTER_END,
    });
    expect(revealed.winner).toEqual({ label: "B", percent: 80 });
  });
});
