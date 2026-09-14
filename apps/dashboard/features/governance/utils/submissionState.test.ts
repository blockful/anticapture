import type { Hash } from "viem";

import {
  canSubmitAgain,
  getModalEntryPoint,
  needsProposalWatch,
  IDLE_SUBMISSION,
  type SubmissionState,
} from "@/features/governance/utils/submissionState";

const hash: Hash = `0x${"ab".repeat(32)}`;

const inFlight: SubmissionState = { kind: "in-flight", mode: "gasless" };
const ambiguousWithHash: SubmissionState = {
  kind: "ambiguous",
  mode: "wallet",
  hash,
};
const ambiguousWithoutHash: SubmissionState = {
  kind: "ambiguous",
  mode: "gasless",
  hash: null,
};
/** A pre-broadcast refusal: nothing was ever sent. */
const doneNothingSent: SubmissionState = {
  kind: "done",
  mode: "wallet",
  outcome: "failed",
  hash: null,
};
/** Mined and reverted: a transaction existed but changed nothing. */
const doneReverted: SubmissionState = {
  kind: "done",
  mode: "wallet",
  outcome: "failed",
  hash,
};
const doneLanded: SubmissionState = {
  kind: "done",
  mode: "gasless",
  outcome: "landed",
  hash,
};

describe("canSubmitAgain", () => {
  it("allows a first submission", () => {
    expect(canSubmitAgain(IDLE_SUBMISSION)).toBe(true);
  });

  it("allows another after an attempt that changed nothing", () => {
    expect(canSubmitAgain(doneNothingSent)).toBe(true);
  });

  it("allows another after a mined revert, which the error screen offers", () => {
    expect(canSubmitAgain(doneReverted)).toBe(true);
  });

  it("refuses one after a transaction landed and has yet to be indexed", () => {
    // Offering the action here is offering the stale action: the proposal has
    // already moved, the indexer just has not caught up.
    expect(canSubmitAgain(doneLanded)).toBe(false);
  });

  it("refuses one while a submission is in flight", () => {
    expect(canSubmitAgain(inFlight)).toBe(false);
  });

  it("refuses one after an ambiguous outcome, with or without a hash", () => {
    expect(canSubmitAgain(ambiguousWithHash)).toBe(false);
    expect(canSubmitAgain(ambiguousWithoutHash)).toBe(false);
  });
});

describe("getModalEntryPoint", () => {
  const connected = {
    isGaslessAvailable: true,
    hasAddress: true,
    hasWalletClient: true,
  };

  it("mirrors a submission in flight instead of offering the choices", () => {
    expect(getModalEntryPoint({ ...connected, submission: inFlight })).toBe(
      "mirror-submission",
    );
  });

  it("shows the ambiguous outcome again rather than the choices", () => {
    expect(
      getModalEntryPoint({ ...connected, submission: ambiguousWithHash }),
    ).toBe("mirror-submission");
  });

  it("shows it again when the relayer never answered and there is no hash", () => {
    expect(
      getModalEntryPoint({ ...connected, submission: ambiguousWithoutHash }),
    ).toBe("mirror-submission");
  });

  it("shows it again even without a relayer, where the wallet flow would start itself", () => {
    expect(
      getModalEntryPoint({
        submission: ambiguousWithoutHash,
        isGaslessAvailable: false,
        hasAddress: true,
        hasWalletClient: true,
      }),
    ).toBe("mirror-submission");
  });

  it("offers the choices when a funded relayer is available and nothing is pending", () => {
    expect(
      getModalEntryPoint({ ...connected, submission: IDLE_SUBMISSION }),
    ).toBe("choose");
  });

  it("keeps the screen of a transaction that landed and is not indexed yet", () => {
    // Falling through to the choices here would put the stale action back on
    // screen while the queue or execute it already did is being indexed.
    expect(getModalEntryPoint({ ...connected, submission: doneLanded })).toBe(
      "mirror-submission",
    );
  });

  it("keeps it even without a relayer, where the wallet flow would start itself", () => {
    expect(
      getModalEntryPoint({
        submission: doneLanded,
        isGaslessAvailable: false,
        hasAddress: true,
        hasWalletClient: true,
      }),
    ).toBe("mirror-submission");
  });

  it("offers the choices again after an attempt that changed nothing", () => {
    expect(getModalEntryPoint({ ...connected, submission: doneReverted })).toBe(
      "choose",
    );
    expect(
      getModalEntryPoint({ ...connected, submission: doneNothingSent }),
    ).toBe("choose");
  });

  it("starts the wallet flow without a relayer", () => {
    expect(
      getModalEntryPoint({
        submission: IDLE_SUBMISSION,
        isGaslessAvailable: false,
        hasAddress: true,
        hasWalletClient: true,
      }),
    ).toBe("wallet");
  });

  it("asks for a wallet when none is connected", () => {
    expect(
      getModalEntryPoint({
        submission: IDLE_SUBMISSION,
        isGaslessAvailable: false,
        hasAddress: false,
        hasWalletClient: false,
      }),
    ).toBe("connect-wallet");
  });

  it("asks for the right network when the wallet client is missing", () => {
    expect(
      getModalEntryPoint({
        submission: IDLE_SUBMISSION,
        isGaslessAvailable: false,
        hasAddress: true,
        hasWalletClient: false,
      }),
    ).toBe("switch-network");
  });
});

describe("dismissing and reopening the modal", () => {
  const entryFor = (submission: SubmissionState) =>
    getModalEntryPoint({
      submission,
      isGaslessAvailable: true,
      hasAddress: true,
      hasWalletClient: true,
    });

  it("keeps a wallet submission blocked while a relayer request is out", () => {
    // Closing the modal does not change the state, so reopening lands on the
    // in-progress screen and no second submission may start.
    expect(entryFor(inFlight)).toBe("mirror-submission");
    expect(canSubmitAgain(inFlight)).toBe(false);
  });

  it("keeps an ambiguous relayer outcome on screen after a reopen", () => {
    // The request resolved as unknown while the modal was closed. Reopening
    // must not fall through to the choices.
    expect(entryFor(ambiguousWithoutHash)).toBe("mirror-submission");
    expect(canSubmitAgain(ambiguousWithoutHash)).toBe(false);
  });

  it("frees the modal once an attempt has changed nothing", () => {
    expect(entryFor(doneNothingSent)).toBe("choose");
    expect(canSubmitAgain(doneNothingSent)).toBe(true);
  });

  it("keeps it closed to a second submission once one landed", () => {
    expect(entryFor(doneLanded)).toBe("mirror-submission");
    expect(canSubmitAgain(doneLanded)).toBe(false);
  });

  it("records what the attempt did, for a mount that never saw it", () => {
    expect(doneLanded.kind === "done" && doneLanded.outcome).toBe("landed");
    expect(doneLanded.kind === "done" && doneLanded.hash).toBe(hash);
    expect(doneNothingSent.kind === "done" && doneNothingSent.outcome).toBe(
      "failed",
    );
  });
});

describe("needsProposalWatch", () => {
  it("watches an ambiguous outcome, with or without a hash", () => {
    // The screen promises that the page keeps checking, so it has to.
    expect(needsProposalWatch(ambiguousWithHash)).toBe(true);
    expect(needsProposalWatch(ambiguousWithoutHash)).toBe(true);
  });

  it("watches a transaction that landed and is not indexed yet", () => {
    expect(needsProposalWatch(doneLanded)).toBe(true);
  });

  it("does not watch an attempt that changed nothing", () => {
    // A mined revert leaves the proposal exactly where it was, so there is
    // nothing for a watch to see.
    expect(needsProposalWatch(doneNothingSent)).toBe(false);
    expect(needsProposalWatch(doneReverted)).toBe(false);
    expect(needsProposalWatch(IDLE_SUBMISSION)).toBe(false);
  });

  it("is the exact complement of canSubmitAgain once a run has settled", () => {
    // The entry point, the close handler and both buttons ask one question,
    // so the two answers can never disagree about the same state.
    for (const state of [
      IDLE_SUBMISSION,
      ambiguousWithHash,
      ambiguousWithoutHash,
      doneNothingSent,
      doneReverted,
      doneLanded,
    ]) {
      expect(needsProposalWatch(state)).toBe(!canSubmitAgain(state));
    }
  });

  it("does not watch a request that has yet to resolve", () => {
    // The run itself starts the watch when it learns there is something to
    // watch for.
    expect(needsProposalWatch(inFlight)).toBe(false);
  });
});
