/**
 * The modal itself cannot be rendered here: the Jest setup matches *.test.ts
 * only, runs in a node environment with no DOM, and has no
 * @testing-library/react. The close/reopen race is therefore decided by these
 * two pure pieces, which the modal only wires up.
 */

import {
  createSubmissionGuard,
  getModalEntryPoint,
} from "@/features/governance/utils/submissionGuard";

describe("createSubmissionGuard", () => {
  it("starts idle", () => {
    expect(createSubmissionGuard().inFlight()).toBeNull();
  });

  it("claims the guard and reports how the submission was sent", () => {
    const guard = createSubmissionGuard();
    expect(guard.begin("gasless")).toBe(true);
    expect(guard.inFlight()).toBe("gasless");
  });

  it("refuses a second submission while one is in flight", () => {
    const guard = createSubmissionGuard();
    guard.begin("gasless");
    expect(guard.begin("gasless")).toBe(false);
  });

  it("refuses a wallet submission while a relayer request is in flight", () => {
    const guard = createSubmissionGuard();
    guard.begin("gasless");
    expect(guard.begin("wallet")).toBe(false);
    expect(guard.inFlight()).toBe("gasless");
  });

  it("allows a new submission once the first settles", () => {
    const guard = createSubmissionGuard();
    guard.begin("gasless");
    guard.end();
    expect(guard.inFlight()).toBeNull();
    expect(guard.begin("wallet")).toBe(true);
  });

  it("ignores a release while idle", () => {
    const guard = createSubmissionGuard();
    guard.end();
    expect(guard.inFlight()).toBeNull();
    expect(guard.begin("wallet")).toBe(true);
  });

  it("keeps separate guards independent", () => {
    const queueGuard = createSubmissionGuard();
    const executeGuard = createSubmissionGuard();
    queueGuard.begin("gasless");
    expect(executeGuard.begin("gasless")).toBe(true);
  });
});

describe("getModalEntryPoint", () => {
  const connected = {
    isGaslessAvailable: true,
    hasAddress: true,
    hasWalletClient: true,
  };

  it("mirrors the submission in flight instead of offering the choices", () => {
    expect(
      getModalEntryPoint({ ...connected, inFlightSubmission: "gasless" }),
    ).toBe("mirror-submission");
  });

  it("mirrors it even without a relayer, where the wallet flow starts itself", () => {
    expect(
      getModalEntryPoint({
        inFlightSubmission: "wallet",
        isGaslessAvailable: false,
        hasAddress: true,
        hasWalletClient: true,
      }),
    ).toBe("mirror-submission");
  });

  it("offers the choices when a funded relayer is available and nothing is pending", () => {
    expect(getModalEntryPoint({ ...connected, inFlightSubmission: null })).toBe(
      "choose",
    );
  });

  it("starts the wallet flow without a relayer", () => {
    expect(
      getModalEntryPoint({
        inFlightSubmission: null,
        isGaslessAvailable: false,
        hasAddress: true,
        hasWalletClient: true,
      }),
    ).toBe("wallet");
  });

  it("asks for a wallet when none is connected", () => {
    expect(
      getModalEntryPoint({
        inFlightSubmission: null,
        isGaslessAvailable: false,
        hasAddress: false,
        hasWalletClient: false,
      }),
    ).toBe("connect-wallet");
  });

  it("asks for the right network when the wallet client is missing", () => {
    expect(
      getModalEntryPoint({
        inFlightSubmission: null,
        isGaslessAvailable: false,
        hasAddress: true,
        hasWalletClient: false,
      }),
    ).toBe("switch-network");
  });
});

describe("dismissing and reopening during a relayer request", () => {
  const entryFor = (inFlightSubmission: "wallet" | "gasless" | null) =>
    getModalEntryPoint({
      inFlightSubmission,
      isGaslessAvailable: true,
      hasAddress: true,
      hasWalletClient: true,
    });

  it("blocks a wallet submission from the reopened modal until the request settles", () => {
    const guard = createSubmissionGuard();

    // The user relays the action, then closes the modal. Closing does not
    // release the guard, because the request may still broadcast.
    expect(guard.begin("gasless")).toBe(true);

    // Reopening shows the request in progress rather than the choices, and
    // "Use my wallet" cannot start a transaction that would race it.
    expect(entryFor(guard.inFlight())).toBe("mirror-submission");
    expect(guard.begin("wallet")).toBe(false);

    // Once the request settles the modal is usable again.
    guard.end();
    expect(entryFor(guard.inFlight())).toBe("choose");
    expect(guard.begin("wallet")).toBe(true);
  });
});
