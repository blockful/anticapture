import { summarizeOffchainTally } from "./OffchainResultsCard";

describe("summarizeOffchainTally", () => {
  it("uses scores_total as the denominator, not the sum of the bars", () => {
    // Approval ballot where every voter approved two of three options: the
    // scores sum to twice the power that voted, so the winner must read 100%.
    const { total } = summarizeOffchainTally({
      scores: [100, 60, 40],
      scoresTotal: 100,
    });

    expect(total).toBe(100);
    expect((100 / total) * 100).toBe(100);
  });

  it("falls back to the sum when scores_total is absent", () => {
    expect(
      summarizeOffchainTally({ scores: [60, 40], scoresTotal: 0 }),
    ).toEqual({ indexedTotal: 100, total: 100, isTallyEmpty: false });
  });

  it("adds a just-signed voter to turnout once, whatever they picked", () => {
    const { total } = summarizeOffchainTally({
      scores: [100, 60],
      scoresTotal: 100,
      optimisticVotingPower: 10,
    });

    expect(total).toBe(110);
  });

  it("separates an unrevealed Shutter tally from one with no votes", () => {
    // Turnout accrues while the choices stay encrypted -> reveal pending.
    const pending = summarizeOffchainTally({
      scores: [0, 0],
      scoresTotal: 500,
    });
    expect(pending.isTallyEmpty && pending.indexedTotal > 0).toBe(true);

    // Nobody voted: nothing to decrypt, so the card must not wait forever.
    const empty = summarizeOffchainTally({ scores: [0, 0], scoresTotal: 0 });
    expect(empty.isTallyEmpty && empty.indexedTotal > 0).toBe(false);
  });
});
