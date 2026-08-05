import { ProposalFormSchema } from "@/features/create-proposal/schema";

describe("ProposalFormSchema", () => {
  const valid = {
    title: "My proposal",
    discussionUrl: "https://discuss.ens.domains/t/1",
    body: "Body content",
    actions: [
      {
        type: "eth-transfer" as const,
        recipient: "0x1111111111111111111111111111111111111111",
        amount: "1",
      },
    ],
  };

  test("accepts a valid form", () => {
    expect(ProposalFormSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects empty title", () => {
    expect(ProposalFormSchema.safeParse({ ...valid, title: "" }).success).toBe(
      false,
    );
  });

  test("rejects non-URL discussion url", () => {
    expect(
      ProposalFormSchema.safeParse({ ...valid, discussionUrl: "not-a-url" })
        .success,
    ).toBe(false);
  });

  test("accepts body over 10,000 chars", () => {
    expect(
      ProposalFormSchema.safeParse({ ...valid, body: "a".repeat(10_001) })
        .success,
    ).toBe(true);
  });

  test("accepts body at the 100,000 char draft-storage ceiling", () => {
    expect(
      ProposalFormSchema.safeParse({ ...valid, body: "a".repeat(100_000) })
        .success,
    ).toBe(true);
  });

  test("rejects body over the 100,000 char draft-storage ceiling", () => {
    expect(
      ProposalFormSchema.safeParse({ ...valid, body: "a".repeat(100_001) })
        .success,
    ).toBe(false);
  });

  describe("address casing", () => {
    const withRecipient = (recipient: string) =>
      ProposalFormSchema.safeParse({
        ...valid,
        actions: [{ ...valid.actions[0], recipient }],
      });

    const miscased = "0x39D3F4633dE1F5E2a1e2f4d3fD6d1AAf2E9c8b71";

    test.each([
      ["a miscased address", miscased, true],
      ["the same address lowercased", miscased.toLowerCase(), true],
      [
        "the same address checksummed",
        "0x39D3f4633de1F5E2A1E2f4D3fD6D1AAF2E9C8B71",
        true,
      ],
      ["an ENS name", "vitalik.eth", true],
      ["an address one character short", miscased.slice(0, -1), false],
      ["a non-hex address", `0xZZ${miscased.slice(4)}`, false],
      ["an address with no 0x prefix", miscased.slice(2), false],
    ])("%s", (_label, recipient, accepted) => {
      expect(withRecipient(recipient).success).toBe(accepted);
    });
  });

  describe("amount precision", () => {
    const withAmount = (action: Record<string, unknown>) =>
      ProposalFormSchema.safeParse({
        title: "t",
        body: "b",
        discussionUrl: "",
        actions: [action],
      });

    const eth = (amount: string) => ({
      type: "eth-transfer",
      recipient: "0x1111111111111111111111111111111111111111",
      amount,
    });
    const usdc = (amount: string) => ({
      type: "erc20-transfer",
      recipient: "0x1111111111111111111111111111111111111111",
      tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      amount,
      decimals: 6,
    });

    test.each([
      ["ETH at 18 places", eth("0." + "1".repeat(18)), true],
      ["ETH at 19 places", eth("0." + "1".repeat(19)), false],
      ["a 6-decimal token at 6 places", usdc("0.123456"), true],
      ["a 6-decimal token at 7 places", usdc("0.1234567"), false],
      ["a 6-decimal token rounding to zero", usdc("0.0000001"), false],
    ])("%s", (_label, action, valid) => {
      expect(withAmount(action).success).toBe(valid);
    });
  });
});
