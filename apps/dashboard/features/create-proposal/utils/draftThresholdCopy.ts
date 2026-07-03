export type DraftPreviewCopyInput =
  | { role: "author" }
  | { role: "recipient"; state: "eligible" }
  | { role: "recipient"; state: "disconnected" }
  | {
      role: "recipient";
      state: "below-threshold";
      thresholdDisplay: string;
      vpDisplay: string;
      tokenSymbol: string;
    };

export const draftPreviewCopy = (input: DraftPreviewCopyInput): string => {
  if (input.role === "author") {
    return "This draft hasn't been submitted on-chain yet. Share the link so someone can review it, or submit it for you.";
  }
  switch (input.state) {
    case "eligible":
      return "This draft was shared with you. Review it, then publish it on-chain. You can also edit it to make your own copy.";
    case "disconnected":
      return "This draft was shared with you. Connect your wallet to publish it on-chain, or edit it to make your own copy.";
    case "below-threshold":
      return `You need ${input.thresholdDisplay} ${input.tokenSymbol} to submit a proposal. This wallet holds ${input.vpDisplay}. Ask someone with enough voting power to publish it, or edit it to make your own copy.`;
  }
};
