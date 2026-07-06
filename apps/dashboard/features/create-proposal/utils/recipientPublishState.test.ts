import { getRecipientPublishState } from "./recipientPublishState";

describe("getRecipientPublishState", () => {
  it("returns 'disconnected' when no address", () => {
    expect(
      getRecipientPublishState({
        address: undefined,
        votingPower: 0n,
        threshold: 100n,
      }),
    ).toBe("disconnected");
  });

  it("returns 'below-threshold' when voting power is under the threshold", () => {
    expect(
      getRecipientPublishState({
        address: "0xabc",
        votingPower: 38n,
        threshold: 100n,
      }),
    ).toBe("below-threshold");
  });

  it("returns 'eligible' when voting power meets the threshold", () => {
    expect(
      getRecipientPublishState({
        address: "0xabc",
        votingPower: 100n,
        threshold: 100n,
      }),
    ).toBe("eligible");
  });

  it("treats an empty address as disconnected", () => {
    expect(
      getRecipientPublishState({
        address: "",
        votingPower: 100n,
        threshold: 100n,
      }),
    ).toBe("disconnected");
  });
});
