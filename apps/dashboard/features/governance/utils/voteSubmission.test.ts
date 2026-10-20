/**
 * The voting modal cannot be rendered here (node environment, no DOM), so
 * the decisions it takes are covered against these functions instead: the
 * claim that blocks a second submission, the screen a reopened modal shows,
 * and what each relay outcome leaves in the store.
 *
 * The store is module-level, so every test uses a key of its own.
 */

import type { Address, Hash } from "viem";

import type { GaslessVoteOutcome } from "@/features/governance/utils/relayGaslessVote";
import { readSubmission } from "@/features/governance/utils/submissionStore";
import {
  claimVote,
  getVoteScreen,
  readVoteSupport,
  settleVote,
  settlementForGaslessVote,
  settlementForWalletVote,
  submittedVoteSupport,
  voteSubmissionKey,
} from "@/features/governance/utils/voteSubmission";
import { DaoIdEnum } from "@/shared/types/daos";

const hash: Hash = `0x${"ab".repeat(32)}`;
const voter: Address = "0x76A6D08b82034b397E7e09dAe4377C18F132BbB8";

let keyCount = 0;
const freshKey = () =>
  voteSubmissionKey(DaoIdEnum.ENS, `proposal-${keyCount++}`, voter);

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
    expect(readVoteSupport(key)).toBe(1);
  });

  it("allows a new attempt only after one that changed nothing", () => {
    const key = freshKey();
    claimVote(key, "gasless", 1);
    settleVote(key, settlementForWalletVote(null));

    expect(claimVote(key, "gasless", 0)).toBe(true);
    expect(readVoteSupport(key)).toBe(0);
  });

  it("keeps a landed vote closed", () => {
    const key = freshKey();
    claimVote(key, "gasless", 1);
    settleVote(key, settlementForGaslessVote({ status: "success", hash }));

    expect(claimVote(key, "gasless", 1)).toBe(false);
  });
});

describe("settleVote", () => {
  it("records the outcome of the run that claimed the vote", () => {
    const key = freshKey();
    claimVote(key, "gasless", 1);
    settleVote(key, settlementForGaslessVote({ status: "success", hash }));

    expect(readSubmission(key)).toEqual({
      kind: "done",
      mode: "gasless",
      outcome: "landed",
      hash,
    });
  });

  it("ignores a settle with no run in flight", () => {
    const key = freshKey();
    settleVote(key, settlementForGaslessVote({ status: "success", hash }));

    expect(readSubmission(key)).toEqual({ kind: "idle" });
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
      { kind: "done", outcome: "landed", hash: null },
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
    expect(getVoteScreen({ kind: "idle" })).toBe("ballot");
    expect(
      getVoteScreen({
        kind: "done",
        mode: "gasless",
        outcome: "failed",
        hash: null,
      }),
    ).toBe("ballot");
  });

  it("mirrors a submission that is out, landed or in doubt after a reopen", () => {
    expect(getVoteScreen({ kind: "in-flight", mode: "gasless" })).toBe(
      "in-flight",
    );
    expect(
      getVoteScreen({
        kind: "done",
        mode: "gasless",
        outcome: "landed",
        hash,
      }),
    ).toBe("landed");
    expect(getVoteScreen({ kind: "ambiguous", mode: "gasless", hash })).toBe(
      "pending",
    );
  });
});

describe("submittedVoteSupport", () => {
  it("names the vote only once it is known to be on-chain", () => {
    const landed = {
      kind: "done" as const,
      mode: "gasless" as const,
      outcome: "landed" as const,
      hash,
    };
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
