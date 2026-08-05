import {
  PROPOSAL_IMPORT_EXAMPLE,
  PROPOSAL_IMPORT_SPEC,
} from "@/features/create-proposal/constants";
import {
  formatImportIssue,
  parseProposalJson,
} from "@/features/create-proposal/utils/parseProposalJson";

/*
 * SPEC-6 asks for the payload to be generated in CI from the schema plus the example.
 * Deriving the FIELDS prose from zod would mean annotating the schema with that prose,
 * which just moves the sentences. What actually drifted was executable: the claim that
 * the example is valid, and that a tuple can be keyed. Both are tested here, and the
 * example lives in one place the spec and this test both read.
 */

const reasons = (text: string) => {
  const result = parseProposalJson(text);
  return result.ok ? "" : result.issues.map(formatImportIssue).join("; ");
};

describe("the copyable spec", () => {
  it("embeds an example the parser accepts", () => {
    expect(reasons(PROPOSAL_IMPORT_EXAMPLE)).toBe("");
  });

  it("embeds that example verbatim, so there is one copy of it", () => {
    expect(PROPOSAL_IMPORT_SPEC).toContain(PROPOSAL_IMPORT_EXAMPLE);
  });

  it("keeps the version stamp a model can quote back", () => {
    expect(PROPOSAL_IMPORT_SPEC).toMatch(/\(v\d+, \d{4}-\d{2}\)/);
  });

  // Without this line models wrap their output in prose and code fences, and the
  // author pastes back something that will not parse.
  it("opens with the instruction that keeps the output parseable", () => {
    expect(PROPOSAL_IMPORT_SPEC).toContain(
      "Return a single JSON object and nothing else",
    );
  });

  // SPEC-5: the example withheld the abi/args branch while it was broken, so
  // models were only ever taught the calldata form. Now that composite args
  // work, the example has to show it.
  it("shows the abi and args branch, not only raw calldata", () => {
    const example = JSON.parse(PROPOSAL_IMPORT_EXAMPLE) as {
      actions: Record<string, unknown>[];
    };
    const custom = example.actions.filter((a) => a.type === "custom");
    expect(custom.some((a) => "calldata" in a)).toBe(true);
    expect(custom.some((a) => "abi" in a && "args" in a)).toBe(true);
  });

  // The rules are what a model reads; each of these is enforced by the parser,
  // so a rule that stops being true has to stop being claimed.
  it.each([
    ["the quoting rule", "Every figure must be a quoted string"],
    ["the wei warning", "Amounts are human-readable, never wei"],
    ["the ENS allowance", "recipient takes an address or an ENS name"],
    [
      "the tuple shapes",
      "A tuple is an object keyed by component name, or an array in component order.",
    ],
    ["the placeholder warning", "Addresses below are placeholders"],
  ])("states %s", (_label, sentence) => {
    // The payload is hand-wrapped, so a rule can straddle a line break.
    expect(PROPOSAL_IMPORT_SPEC.replace(/\s+/g, " ")).toContain(sentence);
  });

  // Every address in the example is keccak-derived on purpose. A model will
  // carry a real one straight into generated output, where a correct-looking
  // address in the right slot passes review.
  it("uses no real, well-known contract address", () => {
    const realContracts = [
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72", // ENS
      "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e", // ENS registry
    ];
    const lowered = PROPOSAL_IMPORT_SPEC.toLowerCase();
    realContracts.forEach((address) => {
      expect(lowered).not.toContain(address);
    });
  });
});
