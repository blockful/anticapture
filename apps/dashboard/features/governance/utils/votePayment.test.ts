/**
 * The one rule these tests hold the ballot to: whatever the relayer is doing,
 * a voter who can vote is offered a way to, and the wallet is that way
 * whenever the relayer cannot be trusted with the ballot.
 */

import {
  canReturnToGasless,
  getSubmitLabel,
  getVotePayment,
} from "@/features/governance/utils/votePayment";

const healthy = {
  daoHasRelayer: true,
  isRelayerAvailable: true,
  isEligible: true,
  hasComment: false,
  gaslessFailed: false,
  prefersWallet: false,
} as const;

describe("getVotePayment", () => {
  it("relays a plain vote when the relayer is available and the voter eligible", () => {
    expect(getVotePayment(healthy)).toEqual({ mode: "gasless" });
  });

  it("uses the wallet, silently, on a DAO without a relayer", () => {
    expect(getVotePayment({ ...healthy, daoHasRelayer: false })).toEqual({
      mode: "wallet",
      reason: "none",
    });
  });

  it("uses the wallet and says so when the relayer reports itself unavailable", () => {
    expect(getVotePayment({ ...healthy, isRelayerAvailable: false })).toEqual({
      mode: "wallet",
      reason: "relayer-unavailable",
    });
  });

  // Eligibility is computed from the status too, so an unavailable relayer
  // also reads as "not eligible"; the voter must still hear the real reason.
  it("names the unavailable relayer even when eligibility follows it down", () => {
    expect(
      getVotePayment({
        ...healthy,
        isRelayerAvailable: false,
        isEligible: false,
      }),
    ).toEqual({ mode: "wallet", reason: "relayer-unavailable" });
  });

  it("does not hold the ballot while the status is loading", () => {
    expect(getVotePayment({ ...healthy, isRelayerAvailable: null })).toEqual({
      mode: "wallet",
      reason: "none",
    });
  });

  it("uses the wallet without a warning for a voter the relayer would not sponsor", () => {
    expect(getVotePayment({ ...healthy, isEligible: false })).toEqual({
      mode: "wallet",
      reason: "none",
    });
  });

  it("keeps a failed relay on the wallet even if the status still says available", () => {
    expect(getVotePayment({ ...healthy, gaslessFailed: true })).toEqual({
      mode: "wallet",
      reason: "gasless-failed",
    });
  });

  it("sends a commented vote through the wallet", () => {
    expect(getVotePayment({ ...healthy, hasComment: true })).toEqual({
      mode: "wallet",
      reason: "comment",
    });
  });

  it("honours a voter who chose to pay gas", () => {
    expect(getVotePayment({ ...healthy, prefersWallet: true })).toEqual({
      mode: "wallet",
      reason: "wallet-chosen",
    });
  });

  it("never answers anything but gasless or wallet", () => {
    const flags = [true, false];
    for (const daoHasRelayer of flags)
      for (const isRelayerAvailable of [true, false, null])
        for (const isEligible of flags)
          for (const hasComment of flags)
            for (const gaslessFailed of flags)
              for (const prefersWallet of flags) {
                const payment = getVotePayment({
                  daoHasRelayer,
                  isRelayerAvailable,
                  isEligible,
                  hasComment,
                  gaslessFailed,
                  prefersWallet,
                });
                if (payment.mode === "gasless") {
                  expect(isRelayerAvailable).toBe(true);
                  expect(gaslessFailed).toBe(false);
                } else {
                  expect(payment.mode).toBe("wallet");
                }
              }
  });
});

describe("canReturnToGasless", () => {
  it("offers the relayer back only to a voter who left it by choice", () => {
    expect(
      canReturnToGasless({ mode: "wallet", reason: "wallet-chosen" }),
    ).toBe(true);
    expect(
      canReturnToGasless({ mode: "wallet", reason: "gasless-failed" }),
    ).toBe(false);
    expect(
      canReturnToGasless({ mode: "wallet", reason: "relayer-unavailable" }),
    ).toBe(false);
    expect(canReturnToGasless({ mode: "gasless" })).toBe(false);
  });
});

describe("getSubmitLabel", () => {
  it("names the wallet on a DAO that also offers gas-free votes", () => {
    expect(
      getSubmitLabel({ mode: "wallet", reason: "relayer-unavailable" }, true),
    ).toBe("Vote with wallet");
    expect(getSubmitLabel({ mode: "gasless" }, true)).toBe("Submit gas-free");
  });

  it("keeps the plain label on a DAO without a relayer", () => {
    expect(getSubmitLabel({ mode: "wallet", reason: "none" }, false)).toBe(
      "Submit",
    );
  });
});
