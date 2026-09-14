import {
  classifyRelayerFailure,
  getRelayerErrorCode,
  getRelayerRevertedHash,
  mapRelayerEnactmentError,
  mapRelayerError,
} from "@/shared/utils/gaslessRelayerError";

const relayerError = (status: number, code?: string, message?: string) =>
  Object.assign(new Error("Request failed"), {
    status,
    response: {
      status,
      statusText: "",
      headers: new Headers(),
      data: code ? { code, error: message ?? code } : { error: "boom" },
    },
  });

/** A body that is not JSON at all, as a proxy or CDN page would be. */
const unstructuredError = (status: number) =>
  Object.assign(new Error("Request failed"), {
    status,
    response: {
      status,
      statusText: "",
      headers: new Headers(),
      data: "<html>Gateway Timeout</html>",
    },
  });

describe("getRelayerErrorCode", () => {
  it("reads the structured relayer code", () => {
    expect(getRelayerErrorCode(relayerError(409, "SIMULATION_FAILED"))).toBe(
      "SIMULATION_FAILED",
    );
  });

  it("returns undefined for unstructured failures", () => {
    expect(getRelayerErrorCode(relayerError(503))).toBeUndefined();
    expect(getRelayerErrorCode(new Error("network"))).toBeUndefined();
    expect(getRelayerErrorCode(undefined)).toBeUndefined();
  });
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

  it("does not read a bare 503 as the relayer being out of funds", () => {
    expect(mapRelayerEnactmentError(relayerError(503), "execute")).toMatch(
      /could not execute/i,
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

describe("classifyRelayerFailure", () => {
  it.each([
    ["INSUFFICIENT_VOTING_POWER", 400],
    ["INVALID_SIGNATURE", 400],
    ["INVALID_CONTRACT", 400],
    ["RATE_LIMITED", 429],
    ["PROPOSAL_NOT_FOUND", 404],
    ["PROPOSAL_DATA_MISMATCH", 422],
    ["INVALID_PROPOSAL_STATE", 409],
    ["TIMELOCK_NOT_READY", 409],
    ["SIMULATION_FAILED", 409],
  ])("calls %s pre-broadcast", (code, status) => {
    expect(classifyRelayerFailure(relayerError(status, code))).toBe(
      "pre-broadcast",
    );
  });

  it.each(["RELAYER_LOW_BALANCE", "RATE_LIMITER_UNAVAILABLE"])(
    "calls the structured 503 %s pre-broadcast rather than ambiguous",
    (code) => {
      expect(classifyRelayerFailure(relayerError(503, code))).toBe(
        "pre-broadcast",
      );
    },
  );

  it("calls a reported revert reverted", () => {
    expect(
      classifyRelayerFailure(relayerError(409, "TRANSACTION_REVERTED")),
    ).toBe("reverted");
  });

  it("calls a gateway 4xx without a relayer code pre-broadcast", () => {
    // Gateful answers like this for an unknown DAO or an unconfigured relayer.
    expect(classifyRelayerFailure(relayerError(400))).toBe("pre-broadcast");
    expect(classifyRelayerFailure(relayerError(404))).toBe("pre-broadcast");
  });

  it("calls a 5xx without a structured code ambiguous", () => {
    expect(classifyRelayerFailure(relayerError(500))).toBe("ambiguous");
    expect(classifyRelayerFailure(unstructuredError(504))).toBe("ambiguous");
  });

  it("calls Gateful's open circuit pre-broadcast, since nothing was proxied", () => {
    const circuitOpen = Object.assign(new Error("Request failed"), {
      status: 503,
      response: {
        status: 503,
        statusText: "",
        headers: new Headers(),
        data: { error: "DAO service temporarily unavailable" },
      },
    });
    expect(classifyRelayerFailure(circuitOpen)).toBe("pre-broadcast");
    // Any other bare 503 still says nothing about whether a transaction exists.
    expect(classifyRelayerFailure(relayerError(503))).toBe("ambiguous");
  });

  it("calls a transport failure with no status ambiguous", () => {
    expect(classifyRelayerFailure(new Error("Failed to fetch"))).toBe(
      "ambiguous",
    );
    expect(classifyRelayerFailure(undefined)).toBe("ambiguous");
  });
});

describe("getRelayerRevertedHash", () => {
  const hash = `0x${"ab".repeat(32)}`;

  it("reads the hash out of the revert message", () => {
    expect(
      getRelayerRevertedHash(
        relayerError(
          409,
          "TRANSACTION_REVERTED",
          `Transaction ${hash} was mined but reverted on-chain`,
        ),
      ),
    ).toBe(hash);
  });

  it("returns null for any other failure", () => {
    expect(
      getRelayerRevertedHash(relayerError(409, "SIMULATION_FAILED")),
    ).toBeNull();
    expect(getRelayerRevertedHash(new Error("network"))).toBeNull();
  });

  it("returns null when the revert message carries no hash", () => {
    expect(
      getRelayerRevertedHash(
        relayerError(409, "TRANSACTION_REVERTED", "reverted on-chain"),
      ),
    ).toBeNull();
  });
});
