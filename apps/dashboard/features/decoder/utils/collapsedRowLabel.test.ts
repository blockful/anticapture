import { buildCollapsedRowLabel } from "@/features/decoder/utils/collapsedRowLabel";

describe("buildCollapsedRowLabel", () => {
  test("a summary leads with the signature as suffix", () => {
    expect(
      buildCollapsedRowLabel(
        {
          summary: "Transfers 25,000 USDC to grants.ens.eth.",
          signature: "transfer(address,uint256)",
        },
        "0xa9059cbb",
      ),
    ).toEqual({
      label: "Transfers 25,000 USDC to grants.ens.eth.",
      signature: "transfer(address,uint256)",
    });
  });

  test("no summary falls back to the signature alone", () => {
    expect(
      buildCollapsedRowLabel(
        { summary: null, signature: "mint(address,uint256)" },
        "0x40c10f19",
      ),
    ).toEqual({ label: "mint(address,uint256)" });
  });

  test("no decode yet falls back to the raw selector", () => {
    expect(
      buildCollapsedRowLabel(undefined, `0xa9059cbb${"0".repeat(128)}`),
    ).toEqual({ label: "selector 0xa9059cbb" });
  });

  test("attached ETH on a real function call is appended to the label", () => {
    expect(
      buildCollapsedRowLabel(
        { summary: null, signature: "execute(bytes)" },
        "0xdeadbeef",
        1_500_000_000_000_000_000n,
      ),
    ).toEqual({ label: "execute(bytes) · sends 1.5 ETH" });
    // The pure ETH transfer already says it in its summary: no double mention.
    expect(
      buildCollapsedRowLabel(
        { summary: "Transfers 1.5 ETH to 0xabc…def." },
        "0x",
        1_500_000_000_000_000_000n,
      ),
    ).toEqual({ label: "Transfers 1.5 ETH to 0xabc…def." });
  });

  test("empty calldata without a transfer summary reads as an empty call", () => {
    // A real ETH transfer carries a decode summary ("Transfers 1.5 ETH…");
    // the fallback only fires when nothing moves.
    expect(buildCollapsedRowLabel(undefined, "0x")).toEqual({
      label: "Empty call",
    });
    expect(
      buildCollapsedRowLabel({ summary: null, signature: undefined }, null),
    ).toEqual({ label: "Empty call" });
  });
});
