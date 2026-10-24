/**
 * The voting modal cannot be rendered here (node environment, no DOM), so
 * the decisions it takes are covered against these functions instead: the
 * claim that blocks a second submission, the screen a reopened modal shows,
 * what each relay outcome leaves in the store, and when the page may stop
 * waiting for the indexer.
 *
 * The store is module-level, so every test uses a key of its own.
 */

import type { Address, Hash } from "viem";

import type { GaslessVoteOutcome } from "@/features/governance/utils/relayGaslessVote";
import type { SubmissionState } from "@/features/governance/utils/submissionState";
import { readSubmission } from "@/features/governance/utils/submissionStore";
import {
  claimVote,
  getVoteScreen,
  isSubmittedVoteIndexed,
  readVoteDetails,
  releaseUnsentVote,
  settleVote,
  settlementForGaslessVote,
  settlementForWalletVote,
  submittedVoteSupport,
  voteSubmissionKey,
} from "@/features/governance/utils/voteSubmission";
import { DaoIdEnum } from "@/shared/types/daos";

const hash: Hash = `0x${"ab".repeat(32)}`;
const otherHash: Hash = `0x${"cd".repeat(32)}`;
const voter: Address = "0x76A6D08b82034b397E7e09dAe4377C18F132BbB8";

let keyCount = 0;
const freshKey = () =>
  voteSubmissionKey(DaoIdEnum.ENS, `proposal-${keyCount++}`, voter);

const landed: SubmissionState = {
  kind: "done",
  mode: "gasless",
  outcome: "landed",
  hash,
};

const fixedVote = { canChangeVote: false, alreadyVoted: false };

describe("voteSubmissionKey", () => {
  it("keys one voter on one proposal, whatever the address casing", () => {
    expect(voteSubmissionKey(DaoIdEnum.ENS, "1", voter)).toBe(
      voteSubmissionKey(DaoIdEnum.ENS, "1", voter.toLowerCase() as Address),
    );
    expect(voteSubmissionKey(DaoIdEnum.ENS, "1", voter)).not.toBe(
      voteSubmissionKey(DaoIdEnum.ENS, "2", voter),
    );
  });
});

describe("claimVote", () => {
  it("lets exactly one submission start, however fast the second click", () => {
    const key = freshKey();

    expect(claimVote(key, "gasless", 1)).toBe(true);
    expect(claimVote(key, "gasless", 1)).toBe(false);
    expect(claimVote(key, "wallet", 0)).toBe(false);
    expect(readSubmission(key)).toEqual({ kind: "in-flight", mode: "gasless" });
    expect(readVoteDetails(key)).toEqual({ support: 1, alreadyVoted: false });
  });

  it("allows a new attempt only after one that changed nothing", () => {
    const key = freshKey();
    claimVote(key, "gasless", 1);
    settleVote(key, settlementForWalletVote(null));

    expect(claimVote(key, "gasless", 0)).toBe(true);
    expect(readVoteDetails(key).support).toBe(0);
  });

  it("keeps a landed vote closed where the governor fixes the first vote", () => {
    const key = freshKey();
    claimVote(key, "gasless", 1);
    settleVote(key, settlementForGaslessVote({ status: "success", hash }));

    expect(claimVote(key, "gasless", 1)).toBe(false);
  });

  it("lets a landed vote be changed where the DAO allows it", () => {
    const key = freshKey();
    claimVote(key, "wallet", 1, true);
    settleVote(key, settlementForWalletVote(hash));

    expect(claimVote(key, "wallet", 0, true)).toBe(true);
    expect(readVoteDetails(key).support).toBe(0);
  });

  it("never lets a change of vote race a submission still out or in doubt", () => {
    const key = freshKey();
    claimVote(key, "wallet", 1, true);
    expect(claimVote(key, "wallet", 0, true)).toBe(false);

    settleVote(key, { kind: "ambiguous", hash: null });
    expect(claimVote(key, "wallet", 0, true)).toBe(false);
  });
});

describe("settleVote", () => {
  it("records the outcome of the run that claimed the vote", () => {
    const key = freshKey();
    claimVote(key, "gasless", 1);
    settleVote(key, settlementForGaslessVote({ status: "success", hash }));

    expect(readSubmission(key)).toEqual(landed);
  });

  it("ignores a settle with no run in flight", () => {
    const key = freshKey();
    settleVote(key, settlementForGaslessVote({ status: "success", hash }));

    expect(readSubmission(key)).toEqual({ kind: "idle" });
  });

  // The ballot on screen was never cast, so its choice must not be shown as
  // the vote the governor holds.
  it("forgets the attempted choice when the governor already held a vote", () => {
    const key = freshKey();
    claimVote(key, "gasless", 0);
    settleVote(
      key,
      settlementForGaslessVote({ status: "already-voted", hash: null }),
    );

    expect(readVoteDetails(key)).toEqual({ support: null, alreadyVoted: true });
    expect(
      submittedVoteSupport(readSubmission(key), readVoteDetails(key).support),
    ).toBeUndefined();
  });
});

describe("settlementForGaslessVote", () => {
  const cases: Array<
    [GaslessVoteOutcome, ReturnType<typeof settlementForGaslessVote>]
  > = [
    [
      { status: "success", hash },
      { kind: "done", outcome: "landed", hash },
    ],
    [
      { status: "already-voted", hash: null },
      { kind: "done", outcome: "landed", hash: null, alreadyVoted: true },
    ],
    [
      { status: "reverted", hash },
      { kind: "done", outcome: "failed", hash },
    ],
    [
      { status: "unconfirmed", hash },
      { kind: "ambiguous", hash },
    ],
    [
      { status: "unknown", hash: null },
      { kind: "ambiguous", hash: null },
    ],
  ];

  it.each(cases)("maps %o to %o", (outcome, expected) => {
    expect(settlementForGaslessVote(outcome)).toEqual(expected);
  });
});

describe("getVoteScreen", () => {
  it("shows the ballot only when a submission may start", () => {
    expect(getVoteScreen({ kind: "idle" }, fixedVote)).toBe("ballot");
    expect(
      getVoteScreen(
        { kind: "done", mode: "gasless", outcome: "failed", hash: null },
        fixedVote,
      ),
    ).toBe("ballot");
  });

  it("mirrors a submission that is out, landed or in doubt after a reopen", () => {
    expect(
      getVoteScreen({ kind: "in-flight", mode: "gasless" }, fixedVote),
    ).toBe("in-flight");
    expect(getVoteScreen(landed, fixedVote)).toBe("landed");
    expect(
      getVoteScreen({ kind: "ambiguous", mode: "gasless", hash }, fixedVote),
    ).toBe("pending");
  });

  it("says so, with no way to vote, when the governor already held a vote", () => {
    expect(
      getVoteScreen(
        { kind: "done", mode: "gasless", outcome: "landed", hash: null },
        { canChangeVote: false, alreadyVoted: true },
      ),
    ).toBe("already-voted");
  });

  it("offers the ballot again for a landed vote where votes can be changed", () => {
    expect(
      getVoteScreen(landed, { canChangeVote: true, alreadyVoted: false }),
    ).toBe("ballot");
  });
});

describe("submittedVoteSupport", () => {
  it("names the vote only once it is known to be on-chain", () => {
    expect(submittedVoteSupport(landed, 1)).toBe(1);
    expect(
      submittedVoteSupport({ kind: "ambiguous", mode: "gasless", hash }, 1),
    ).toBeUndefined();
    expect(
      submittedVoteSupport({ kind: "in-flight", mode: "gasless" }, 1),
    ).toBeUndefined();
    expect(submittedVoteSupport(landed, null)).toBeUndefined();
  });
});

describe("isSubmittedVoteIndexed", () => {
  it("has nothing to wait for without a submission that may be on-chain", () => {
    expect(isSubmittedVoteIndexed({ kind: "idle" }, undefined)).toBe(true);
    expect(
      isSubmittedVoteIndexed({ kind: "in-flight", mode: "wallet" }, undefined),
    ).toBe(true);
  });

  // A changed vote: the API still returns the previous one until the new
  // transaction is indexed, so "a vote exists" is not enough.
  it("waits for the submitted transaction itself, not any earlier vote", () => {
    expect(isSubmittedVoteIndexed(landed, { transactionHash: otherHash })).toBe(
      false,
    );
    expect(
      isSubmittedVoteIndexed(landed, { transactionHash: hash.toUpperCase() }),
    ).toBe(true);
    expect(isSubmittedVoteIndexed(landed, undefined)).toBe(false);
  });

  it("settles for any indexed vote when the transaction is unknown", () => {
    const alreadyVoted: SubmissionState = {
      kind: "done",
      mode: "gasless",
      outcome: "landed",
      hash: null,
    };
    expect(isSubmittedVoteIndexed(alreadyVoted, undefined)).toBe(false);
    expect(
      isSubmittedVoteIndexed(alreadyVoted, { transactionHash: otherHash }),
    ).toBe(true);
  });
});

describe("releaseUnsentVote", () => {
  it("frees a relayed vote that came back with no hash", () => {
    const key = freshKey();
    claimVote(key, "gasless", 1);
    settleVote(
      key,
      settlementForGaslessVote({ status: "unknown", hash: null }),
    );
    expect(getVoteScreen(readSubmission(key), fixedVote)).toBe("pending");

    expect(releaseUnsentVote(key)).toBe(true);
    expect(getVoteScreen(readSubmission(key), fixedVote)).toBe("ballot");
    expect(claimVote(key, "wallet", 1)).toBe(true);
  });

  it("keeps a relayed vote with a hash: that transaction exists", () => {
    const key = freshKey();
    claimVote(key, "gasless", 1);
    settleVote(key, settlementForGaslessVote({ status: "unconfirmed", hash }));

    expect(releaseUnsentVote(key)).toBe(false);
    expect(getVoteScreen(readSubmission(key), fixedVote)).toBe("pending");
  });

  it("leaves every other state alone", () => {
    const inFlight = freshKey();
    claimVote(inFlight, "gasless", 1);
    expect(releaseUnsentVote(inFlight)).toBe(false);
    expect(readSubmission(inFlight).kind).toBe("in-flight");

    const landedKey = freshKey();
    claimVote(landedKey, "gasless", 1);
    settleVote(
      landedKey,
      settlementForGaslessVote({ status: "success", hash }),
    );
    expect(releaseUnsentVote(landedKey)).toBe(false);
    expect(readSubmission(landedKey)).toMatchObject({ outcome: "landed" });

    expect(releaseUnsentVote(freshKey())).toBe(false);
  });
});
