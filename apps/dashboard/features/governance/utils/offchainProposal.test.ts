import { ProposalStatus } from "@/features/governance/types";

import { getOffchainProposalStatus } from "./offchainProposal";

const NOW_SECONDS = 1_800_000_000;

describe("getOffchainProposalStatus", () => {
  it("returns ongoing only for active proposals that have not ended", () => {
    const status = getOffchainProposalStatus(
      "active",
      "basic",
      [1, 0],
      1,
      0,
      NOW_SECONDS + 1,
      NOW_SECONDS,
    );

    expect(status).toBe(ProposalStatus.ONGOING);
  });

  it("does not keep stale active proposals ongoing after end time", () => {
    const status = getOffchainProposalStatus(
      "active",
      "basic",
      [1, 0],
      1,
      0,
      NOW_SECONDS - 1,
      NOW_SECONDS,
    );

    expect(status).toBe(ProposalStatus.PASSED);
  });

  it("returns defeated when Snapshot quorum was not reached", () => {
    const status = getOffchainProposalStatus(
      "closed",
      "basic",
      [5_347_713.99, 0, 1_813.59],
      5_349_527,
      10_000_000,
      NOW_SECONDS - 1,
      NOW_SECONDS,
    );

    expect(status).toBe(ProposalStatus.DEFEATED);
  });

  it("returns passed instead of an on-chain queue state for passed Snapshot proposals", () => {
    const status = getOffchainProposalStatus(
      "closed",
      "basic",
      [10_000_001, 0],
      10_000_001,
      10_000_000,
      NOW_SECONDS - 1,
      NOW_SECONDS,
    );

    expect(status).toBe(ProposalStatus.PASSED);
  });

  it("returns defeated when quorum is reached but against wins", () => {
    const status = getOffchainProposalStatus(
      "closed",
      "basic",
      [1, 2],
      3,
      1,
      NOW_SECONDS - 1,
      NOW_SECONDS,
    );

    expect(status).toBe(ProposalStatus.DEFEATED);
  });

  it("keeps non-basic closed proposals closed", () => {
    const status = getOffchainProposalStatus(
      "closed",
      "single-choice",
      [3, 1],
      4,
      1,
      NOW_SECONDS - 1,
      NOW_SECONDS,
    );

    expect(status).toBe(ProposalStatus.CLOSED);
  });
});
