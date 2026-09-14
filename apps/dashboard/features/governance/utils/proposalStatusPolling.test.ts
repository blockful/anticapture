/**
 * The polling loop in GovernanceActionModal cannot be rendered here: the Jest
 * setup matches *.test.ts only, runs in a node environment with no DOM, and
 * has no @testing-library/react. The loop therefore delegates every stop
 * decision to `getStatusPollStep`, which is pure and covered below.
 */

import {
  getStatusPollStep,
  hasIndexedGovernanceAction,
  hasSupersededGovernanceAction,
  STATUS_POLL_MAX_ATTEMPTS,
} from "@/features/governance/utils/proposalStatusPolling";

describe("hasIndexedGovernanceAction", () => {
  it("treats the queued family as proof that a queue was indexed", () => {
    expect(hasIndexedGovernanceAction("queue", "queued")).toBe(true);
    expect(hasIndexedGovernanceAction("queue", "pending_execution")).toBe(true);
    expect(hasIndexedGovernanceAction("queue", "executed")).toBe(true);
    expect(hasIndexedGovernanceAction("queue", "expired")).toBe(true);
  });

  it("does not treat the pre-queue status as proof", () => {
    expect(hasIndexedGovernanceAction("queue", "succeeded")).toBe(false);
  });

  it("accepts only executed as proof that an execute was indexed", () => {
    expect(hasIndexedGovernanceAction("execute", "executed")).toBe(true);
    expect(hasIndexedGovernanceAction("execute", "queued")).toBe(false);
    expect(hasIndexedGovernanceAction("execute", "pending_execution")).toBe(
      false,
    );
  });

  it("compares case insensitively", () => {
    expect(hasIndexedGovernanceAction("execute", "EXECUTED")).toBe(true);
    expect(hasIndexedGovernanceAction("queue", "Pending_Execution")).toBe(true);
  });
});

describe("getStatusPollStep", () => {
  it("settles once the queue successor status is indexed", () => {
    expect(
      getStatusPollStep({
        action: "queue",
        proposalStatus: "queued",
        attempts: 1,
      }),
    ).toBe("settled");
  });

  it("settles once the execute successor status is indexed", () => {
    expect(
      getStatusPollStep({
        action: "execute",
        proposalStatus: "executed",
        attempts: 3,
      }),
    ).toBe("settled");
  });

  it("keeps polling while the status is still the one at submit", () => {
    expect(
      getStatusPollStep({
        action: "execute",
        proposalStatus: "pending_execution",
        attempts: 0,
      }),
    ).toBe("keep-polling");
  });

  it("keeps polling through a transient status that is neither the one at submit nor the successor", () => {
    // The API falls back to the indexed `queued` value when its timelock RPC
    // reads fail, so an execute in flight can see this without the execute
    // having been indexed.
    expect(
      getStatusPollStep({
        action: "execute",
        proposalStatus: "queued",
        attempts: 5,
      }),
    ).toBe("keep-polling");
  });

  it("keeps polling on the last refetch of the budget", () => {
    expect(
      getStatusPollStep({
        action: "execute",
        proposalStatus: "queued",
        attempts: STATUS_POLL_MAX_ATTEMPTS - 1,
      }),
    ).toBe("keep-polling");
  });

  it("times out once the budget is spent", () => {
    // The count includes the refetch issued as soon as the receipt landed, so
    // the run is exactly STATUS_POLL_MAX_ATTEMPTS refetches.
    expect(
      getStatusPollStep({
        action: "execute",
        proposalStatus: "queued",
        attempts: STATUS_POLL_MAX_ATTEMPTS,
      }),
    ).toBe("timed-out");
  });

  it("stops early when the proposal moved out of the action's reach", () => {
    expect(
      getStatusPollStep({
        action: "execute",
        proposalStatus: "canceled",
        attempts: 2,
      }),
    ).toBe("superseded");
  });

  it("stops an execute once the grace period expired", () => {
    expect(
      getStatusPollStep({
        action: "execute",
        proposalStatus: "expired",
        attempts: 2,
      }),
    ).toBe("superseded");
  });

  it("prefers the successor over a terminal status for a queue", () => {
    // `expired` proves the queue itself was indexed, so it settles rather
    // than superseding.
    expect(
      getStatusPollStep({
        action: "queue",
        proposalStatus: "expired",
        attempts: 2,
      }),
    ).toBe("settled");
  });

  it("settles rather than times out when the successor arrives on the last refetch", () => {
    expect(
      getStatusPollStep({
        action: "queue",
        proposalStatus: "queued",
        attempts: STATUS_POLL_MAX_ATTEMPTS + 10,
      }),
    ).toBe("settled");
  });
});

describe("hasSupersededGovernanceAction", () => {
  it.each(["canceled", "defeated", "no_quorum"])(
    "treats %s as out of reach for a queue",
    (status) => {
      expect(hasSupersededGovernanceAction("queue", status)).toBe(true);
    },
  );

  it.each(["canceled", "defeated", "no_quorum", "expired"])(
    "treats %s as out of reach for an execute",
    (status) => {
      expect(hasSupersededGovernanceAction("execute", status)).toBe(true);
    },
  );

  it("does not treat expired as out of reach for a queue", () => {
    expect(hasSupersededGovernanceAction("queue", "expired")).toBe(false);
  });

  it("does not treat a status the action is still waiting on as out of reach", () => {
    expect(hasSupersededGovernanceAction("execute", "queued")).toBe(false);
    expect(hasSupersededGovernanceAction("queue", "succeeded")).toBe(false);
  });

  it("compares case insensitively", () => {
    expect(hasSupersededGovernanceAction("execute", "CANCELED")).toBe(true);
  });
});
