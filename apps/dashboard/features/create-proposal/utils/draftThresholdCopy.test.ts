import { draftPreviewCopy } from "./draftThresholdCopy";

describe("draftPreviewCopy", () => {
  it("author copy mentions sharing", () => {
    expect(draftPreviewCopy({ role: "author" })).toBe(
      "This draft hasn't been submitted on-chain yet. Share the link so someone can review it, or submit it for you.",
    );
  });

  it("recipient connected with enough VP", () => {
    expect(draftPreviewCopy({ role: "recipient", state: "eligible" })).toBe(
      "This draft was shared with you. Review it, then publish it on-chain. You can also edit it to make your own copy.",
    );
  });

  it("recipient not connected", () => {
    expect(draftPreviewCopy({ role: "recipient", state: "disconnected" })).toBe(
      "This draft was shared with you. Connect your wallet to publish it on-chain, or edit it to make your own copy.",
    );
  });

  it("recipient below threshold uses dynamic numbers", () => {
    expect(
      draftPreviewCopy({
        role: "recipient",
        state: "below-threshold",
        thresholdDisplay: "100K",
        vpDisplay: "38K",
        tokenSymbol: "ENS",
      }),
    ).toBe(
      "You need 100K ENS to submit a proposal. This wallet holds 38K. Ask someone with enough voting power to publish it, or edit it to make your own copy.",
    );
  });
});
