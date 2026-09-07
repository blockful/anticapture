import {
  mapRelayerEnactmentError,
  mapRelayerError,
} from "@/shared/utils/gaslessRelayerError";

const relayerError = (status: number, code?: string) =>
  Object.assign(new Error("Request failed"), {
    status,
    response: {
      status,
      statusText: "",
      headers: new Headers(),
      data: code ? { code, error: code } : { error: "boom" },
    },
  });

describe("mapRelayerEnactmentError", () => {
  it("names the required state for INVALID_PROPOSAL_STATE", () => {
    expect(
      mapRelayerEnactmentError(
        relayerError(409, "INVALID_PROPOSAL_STATE"),
        "queue",
      ),
    ).toMatch(/succeeded/i);
    expect(
      mapRelayerEnactmentError(
        relayerError(409, "INVALID_PROPOSAL_STATE"),
        "execute",
      ),
    ).toMatch(/queued/i);
  });

  it("explains the timelock wait", () => {
    expect(
      mapRelayerEnactmentError(
        relayerError(409, "TIMELOCK_NOT_READY"),
        "execute",
      ),
    ).toMatch(/timelock/i);
  });

  it("says the proposal cannot run on-chain for SIMULATION_FAILED", () => {
    const message = mapRelayerEnactmentError(
      relayerError(409, "SIMULATION_FAILED"),
      "execute",
    );
    expect(message).toMatch(/can't be executed on-chain/i);
    expect(message).toMatch(/no gas was spent/i);
  });

  it("maps the remaining relayer codes", () => {
    expect(
      mapRelayerEnactmentError(
        relayerError(404, "PROPOSAL_NOT_FOUND"),
        "queue",
      ),
    ).toMatch(/could not find/i);
    expect(
      mapRelayerEnactmentError(
        relayerError(422, "PROPOSAL_DATA_MISMATCH"),
        "queue",
      ),
    ).toMatch(/doesn't match/i);
    expect(
      mapRelayerEnactmentError(
        relayerError(503, "RELAYER_LOW_BALANCE"),
        "queue",
      ),
    ).toMatch(/out of funds/i);
    expect(
      mapRelayerEnactmentError(
        relayerError(409, "TRANSACTION_REVERTED"),
        "execute",
      ),
    ).toMatch(/reverted on-chain/i);
  });

  it("treats a bare 503 as the relayer being unavailable", () => {
    expect(mapRelayerEnactmentError(relayerError(503), "execute")).toMatch(
      /out of funds/i,
    );
  });

  it("falls back to a retry message for unknown failures", () => {
    expect(mapRelayerEnactmentError(new Error("network"), "queue")).toMatch(
      /could not queue/i,
    );
    expect(mapRelayerEnactmentError(undefined, "execute")).toMatch(
      /could not execute/i,
    );
  });
});

describe("mapRelayerError", () => {
  const context = {
    operation: "vote" as const,
    minVotingPower: 10n ** 18n,
    decimals: 18,
    symbol: "ENS",
  };

  it("formats the voting power threshold", () => {
    expect(
      mapRelayerError(relayerError(400, "INSUFFICIENT_VOTING_POWER"), context),
    ).toBe(
      "You don't have sufficient voting power to vote. You need minimum 1 ENS",
    );
  });

  it("maps rate limiting by code or status", () => {
    expect(mapRelayerError(relayerError(429, "RATE_LIMITED"), context)).toMatch(
      /maximum operations/i,
    );
    expect(mapRelayerError(relayerError(429), context)).toMatch(
      /maximum operations/i,
    );
  });

  it("falls back to the generic message", () => {
    expect(mapRelayerError(new Error("network"), context)).toMatch(
      /something went wrong/i,
    );
  });
});
