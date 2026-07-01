import { normalizeProposalDescription } from "./normalizeProposalDescription";

describe("normalizeProposalDescription", () => {
  it("unwraps the inner description from a TORN stringified-JSON body", () => {
    const torn = JSON.stringify({
      title: "Tornado Cash Governance Proposal",
      description: "Summary\nThis proposal aims to transition the Registry.",
    });

    expect(normalizeProposalDescription(torn)).toBe(
      "Summary\nThis proposal aims to transition the Registry.",
    );
  });

  it("preserves escaped newlines decoded by JSON.parse", () => {
    const torn = '{"title":"t","description":"line1\\nline2"}';

    expect(normalizeProposalDescription(torn)).toBe("line1\nline2");
  });

  it("returns plain Markdown descriptions unchanged", () => {
    const markdown = "# Deprecation of Linea\n## Simple Summary\n\nGauntlet...";

    expect(normalizeProposalDescription(markdown)).toBe(markdown);
  });

  it("returns the raw string when JSON is malformed", () => {
    const broken = '{"title":"t","description":"oops"'; // missing closing brace

    expect(normalizeProposalDescription(broken)).toBe(broken);
  });

  it("returns the raw string when the JSON object has no string description", () => {
    const noDescription = JSON.stringify({ title: "t" });

    expect(normalizeProposalDescription(noDescription)).toBe(noDescription);
  });

  it("returns the raw string when description is not a string", () => {
    const numericDescription = '{"title":"t","description":42}';

    expect(normalizeProposalDescription(numericDescription)).toBe(
      numericDescription,
    );
  });

  it("does not treat a JSON array as a wrapped description", () => {
    const arrayJson = '["not","an","object"]';

    expect(normalizeProposalDescription(arrayJson)).toBe(arrayJson);
  });

  it("only attempts to parse strings that start with a brace", () => {
    const looksLikeJsonMidway = 'see {"description":"x"} below';

    expect(normalizeProposalDescription(looksLikeJsonMidway)).toBe(
      looksLikeJsonMidway,
    );
  });

  it("handles leading/trailing whitespace around a JSON body", () => {
    const padded = '  {"title":"t","description":"trimmed body"}  ';

    expect(normalizeProposalDescription(padded)).toBe("trimmed body");
  });

  it("returns an empty string for empty, null, or undefined input", () => {
    expect(normalizeProposalDescription("")).toBe("");
    expect(normalizeProposalDescription(null)).toBe("");
    expect(normalizeProposalDescription(undefined)).toBe("");
  });
});
