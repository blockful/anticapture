import type { Hash } from "viem";

import {
  canStartSubmission,
  getModalEntryPoint,
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
const done: SubmissionState = { kind: "done" };

describe("canStartSubmission", () => {
  it("allows a first submission", () => {
    expect(canStartSubmission(IDLE_SUBMISSION)).toBe(true);
  });

  it("allows another after one resolved definitively", () => {
    expect(canStartSubmission(done)).toBe(true);
  });

  it("refuses one while a submission is in flight", () => {
    expect(canStartSubmission(inFlight)).toBe(false);
  });

  it("refuses one after an ambiguous outcome, with or without a hash", () => {
    expect(canStartSubmission(ambiguousWithHash)).toBe(false);
    expect(canStartSubmission(ambiguousWithoutHash)).toBe(false);
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
    ).toBe("ambiguous-outcome");
  });

  it("shows it again when the relayer never answered and there is no hash", () => {
    expect(
      getModalEntryPoint({ ...connected, submission: ambiguousWithoutHash }),
    ).toBe("ambiguous-outcome");
  });

  it("shows it again even without a relayer, where the wallet flow would start itself", () => {
    expect(
      getModalEntryPoint({
        submission: ambiguousWithoutHash,
        isGaslessAvailable: false,
        hasAddress: true,
        hasWalletClient: true,
      }),
    ).toBe("ambiguous-outcome");
  });

  it("offers the choices when a funded relayer is available and nothing is pending", () => {
    expect(
      getModalEntryPoint({ ...connected, submission: IDLE_SUBMISSION }),
    ).toBe("choose");
  });

  it("offers the choices again after a definitive outcome", () => {
    expect(getModalEntryPoint({ ...connected, submission: done })).toBe(
      "choose",
    );
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
    expect(canStartSubmission(inFlight)).toBe(false);
  });

  it("keeps an ambiguous relayer outcome on screen after a reopen", () => {
    // The request resolved as unknown while the modal was closed. Reopening
    // must not fall through to the choices.
    expect(entryFor(ambiguousWithoutHash)).toBe("ambiguous-outcome");
    expect(canStartSubmission(ambiguousWithoutHash)).toBe(false);
  });

  it("frees the modal once a submission resolved definitively", () => {
    expect(entryFor(done)).toBe("choose");
    expect(canStartSubmission(done)).toBe(true);
  });
});
