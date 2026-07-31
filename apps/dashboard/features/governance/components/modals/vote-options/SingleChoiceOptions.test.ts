import { liveImpactBaseline } from "./SingleChoiceOptions";

describe("liveImpactBaseline", () => {
  it("leaves the indexed tally alone for a first vote", () => {
    expect(liveImpactBaseline({ scores: [60, 40] })).toEqual({
      scores: [60, 40],
      total: 100,
    });
  });

  it("takes the wallet's previous ballot back out on a revote", () => {
    // A=60 including this wallet's 10, B=40. Switching A -> B must project
    // A=50, B=50 out of 100 — not A=60, B=50 out of 110.
    const baseline = liveImpactBaseline({
      scores: [60, 40],
      previous: { choice: 1, votingPower: 10 },
    });

    expect(baseline).toEqual({ scores: [50, 40], total: 90 });
    expect(baseline.total + 10).toBe(100);
  });

  it("never drives a score below zero when the indexed tally lags", () => {
    expect(
      liveImpactBaseline({
        scores: [5],
        previous: { choice: 1, votingPower: 10 },
      }),
    ).toEqual({ scores: [0], total: 0 });
  });
});
