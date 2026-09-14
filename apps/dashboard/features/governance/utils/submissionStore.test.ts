/**
 * The modal cannot be rendered here: the Jest setup matches *.test.ts only,
 * runs in a node environment with no DOM, and neither jsdom nor React Testing
 * Library is installed. The two scenarios a component test would cover, a
 * close and reopen mid-flight and an unmount and remount mid-flight, are
 * covered against the store and the entry-point function instead, which is
 * where the modal takes both decisions.
 *
 * The store is module-level, so every test uses a key of its own rather than
 * resetting shared state.
 */

import type { Hash } from "viem";

import {
  canSubmitAgain,
  getModalEntryPoint,
  needsProposalWatch,
} from "@/features/governance/utils/submissionState";
import {
  readSubmission,
  submissionKey,
  subscribeToSubmission,
  writeSubmission,
} from "@/features/governance/utils/submissionStore";

const hash: Hash = `0x${"ab".repeat(32)}`;

const connected = {
  isGaslessAvailable: true,
  hasAddress: true,
  hasWalletClient: true,
};

/** What the modal does when it opens, for whatever the store holds. */
const entryFor = (key: string) =>
  getModalEntryPoint({ ...connected, submission: readSubmission(key) });

describe("submissionKey", () => {
  it("separates the two actions on one proposal", () => {
    expect(submissionKey("ENS", "42", "queue")).not.toBe(
      submissionKey("ENS", "42", "execute"),
    );
  });

  it("separates proposals and DAOs", () => {
    expect(submissionKey("ENS", "42", "queue")).not.toBe(
      submissionKey("ENS", "43", "queue"),
    );
    expect(submissionKey("ENS", "42", "queue")).not.toBe(
      submissionKey("UNI", "42", "queue"),
    );
  });
});

describe("readSubmission", () => {
  it("reports an untouched action as idle", () => {
    expect(readSubmission(submissionKey("ENS", "untouched", "queue"))).toEqual({
      kind: "idle",
    });
  });
});

describe("closing and reopening the modal mid-flight", () => {
  it("offers no way to submit again while the request is unresolved", () => {
    const key = submissionKey("ENS", "close-reopen", "execute");

    writeSubmission(key, { kind: "in-flight", mode: "gasless" });

    // Closing the modal writes nothing, so reopening sees the same state.
    expect(entryFor(key)).toBe("mirror-submission");
    expect(canSubmitAgain(readSubmission(key))).toBe(false);

    writeSubmission(key, {
      kind: "done",
      mode: "wallet",
      outcome: "failed",
      hash: null,
    });
    expect(entryFor(key)).toBe("choose");
    expect(canSubmitAgain(readSubmission(key))).toBe(true);
  });
});

describe("unmounting and remounting the modal mid-flight", () => {
  it("keeps the action claimed across a remount", () => {
    const key = submissionKey("ENS", "remount", "execute");

    // The first mount starts a relayer request, then the route unmounts.
    writeSubmission(key, { kind: "in-flight", mode: "gasless" });

    // A fresh mount reads the same store rather than starting from idle, so
    // the Execute button cannot send a second governor call.
    expect(readSubmission(key)).toEqual({ kind: "in-flight", mode: "gasless" });
    expect(entryFor(key)).toBe("mirror-submission");
    expect(canSubmitAgain(readSubmission(key))).toBe(false);
  });

  it("keeps the action closed after an inherited transaction landed", () => {
    const key = submissionKey("ENS", "remount-sent", "execute");

    writeSubmission(key, { kind: "in-flight", mode: "gasless" });
    writeSubmission(key, {
      kind: "done",
      mode: "gasless",
      outcome: "landed",
      hash,
    });

    // The queue or execute already happened; the indexer has simply not
    // caught up, so opening must not put the stale action back on screen.
    expect(entryFor(key)).toBe("mirror-submission");
    expect(canSubmitAgain(readSubmission(key))).toBe(false);
    expect(needsProposalWatch(readSubmission(key))).toBe(true);
  });

  it("reopens the choices after an inherited attempt that changed nothing", () => {
    const key = submissionKey("ENS", "remount-failed", "execute");

    writeSubmission(key, { kind: "in-flight", mode: "wallet" });
    writeSubmission(key, {
      kind: "done",
      mode: "wallet",
      outcome: "failed",
      hash,
    });

    // A mined revert left the proposal where it was, so a retry is exactly
    // what the error screen should offer.
    expect(entryFor(key)).toBe("choose");
    expect(canSubmitAgain(readSubmission(key))).toBe(true);
    expect(needsProposalWatch(readSubmission(key))).toBe(false);
  });

  it("tells the new mount how the inherited request ended", () => {
    const key = submissionKey("ENS", "remount-resolves", "execute");
    const listener = jest.fn();

    writeSubmission(key, { kind: "in-flight", mode: "gasless" });
    const unsubscribe = subscribeToSubmission(key, listener);

    // The request belongs to a component that is gone, so the outcome reaches
    // the current mount through the store.
    writeSubmission(key, { kind: "ambiguous", mode: "gasless", hash: null });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(entryFor(key)).toBe("mirror-submission");
    unsubscribe();
  });

  it("keeps an ambiguous outcome terminal for that key", () => {
    const key = submissionKey("ENS", "terminal", "queue");

    writeSubmission(key, { kind: "ambiguous", mode: "wallet", hash });

    expect(entryFor(key)).toBe("mirror-submission");
    expect(canSubmitAgain(readSubmission(key))).toBe(false);
  });

  it("restarts the proposal watch for an inherited ambiguous outcome", () => {
    const key = submissionKey("ENS", "inherit-ambiguous", "execute");

    // The user left while this was being watched, so the watch went with the
    // mount that owned it. The screen tells the user the page keeps checking,
    // which is only true if the mount that inherits it starts watching again.
    writeSubmission(key, { kind: "ambiguous", mode: "gasless", hash: null });

    expect(entryFor(key)).toBe("mirror-submission");
    expect(needsProposalWatch(readSubmission(key))).toBe(true);
  });

  it("restarts it for a request that turned ambiguous after the unmount", () => {
    const key = submissionKey("ENS", "ambiguous-after-unmount", "execute");

    writeSubmission(key, { kind: "in-flight", mode: "gasless" });
    // Nothing is watching yet: the run does that itself once it knows there
    // is something to watch for.
    expect(needsProposalWatch(readSubmission(key))).toBe(false);

    writeSubmission(key, { kind: "ambiguous", mode: "gasless", hash });

    expect(needsProposalWatch(readSubmission(key))).toBe(true);
    expect(canSubmitAgain(readSubmission(key))).toBe(false);
  });

  it("leaves the other action on the same proposal alone", () => {
    const queueKey = submissionKey("ENS", "one-action", "queue");
    const executeKey = submissionKey("ENS", "one-action", "execute");

    writeSubmission(queueKey, { kind: "ambiguous", mode: "wallet", hash });

    expect(canSubmitAgain(readSubmission(executeKey))).toBe(true);
    expect(entryFor(executeKey)).toBe("choose");
  });
});

describe("subscribeToSubmission", () => {
  it("notifies on every write to its own key only", () => {
    const key = submissionKey("ENS", "subscribe", "queue");
    const otherKey = submissionKey("ENS", "subscribe-other", "queue");
    const listener = jest.fn();

    const unsubscribe = subscribeToSubmission(key, listener);

    writeSubmission(key, { kind: "in-flight", mode: "wallet" });
    writeSubmission(otherKey, { kind: "in-flight", mode: "wallet" });

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    writeSubmission(key, {
      kind: "done",
      mode: "wallet",
      outcome: "failed",
      hash: null,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns the same snapshot object until the state is written", () => {
    // useSyncExternalStore re-renders whenever the snapshot changes identity.
    const key = submissionKey("ENS", "snapshot", "queue");

    expect(readSubmission(key)).toBe(readSubmission(key));

    writeSubmission(key, { kind: "in-flight", mode: "wallet" });
    expect(readSubmission(key)).toBe(readSubmission(key));
  });
});

describe("store growth", () => {
  it("drops the oldest settled entries but never an unresolved one", () => {
    const pending = submissionKey("ENS", "cap-pending", "execute");
    writeSubmission(pending, { kind: "in-flight", mode: "gasless" });

    // Push the settled entries well past the cap.
    for (let i = 0; i < 120; i += 1) {
      writeSubmission(submissionKey("ENS", `cap-${i}`, "queue"), {
        kind: "done",
        mode: "wallet",
        outcome: "failed",
        hash: null,
      });
    }

    // The unresolved entry is what stops a duplicate submission, so it stays
    // however old it gets.
    expect(readSubmission(pending)).toEqual({
      kind: "in-flight",
      mode: "gasless",
    });
    // The earliest settled entries were forgotten, and reading them is the
    // same as never having submitted.
    expect(readSubmission(submissionKey("ENS", "cap-0", "queue"))).toEqual({
      kind: "idle",
    });
  });
});
