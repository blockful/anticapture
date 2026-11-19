import {
  code,
  paragraphs,
  parseTooltipText,
} from "@/features/revenue/utils/tooltipText";

describe("parseTooltipText", () => {
  it("splits paragraphs on blank lines and collapses wrapped lines", () => {
    expect(
      parseTooltipText("First line\n  continues here.\n\n\nSecond paragraph."),
    ).toEqual([
      [{ kind: "text", value: "First line continues here." }],
      [{ kind: "text", value: "Second paragraph." }],
    ]);
  });

  it("marks backticked spans as code and keeps the text around them", () => {
    expect(parseTooltipText("Formula: `a ÷ b × 100` per year.")).toEqual([
      [
        { kind: "text", value: "Formula: " },
        { kind: "code", value: "a ÷ b × 100" },
        { kind: "text", value: " per year." },
      ],
    ]);
  });

  it("handles a paragraph that is only a formula, and two in a row", () => {
    expect(parseTooltipText("`$10 ÷ 2 = $5`")).toEqual([
      [{ kind: "code", value: "$10 ÷ 2 = $5" }],
    ]);
    expect(parseTooltipText("`a` `b`")).toEqual([
      [
        { kind: "code", value: "a" },
        { kind: "text", value: " " },
        { kind: "code", value: "b" },
      ],
    ]);
  });

  it("prints an unpaired backtick as text instead of swallowing the rest", () => {
    expect(parseTooltipText("Renewed `terms ÷ expiring")).toEqual([
      [{ kind: "text", value: "Renewed `terms ÷ expiring" }],
    ]);
    expect(parseTooltipText("`a` then `b")).toEqual([
      [
        { kind: "code", value: "a" },
        { kind: "text", value: " then `b" },
      ],
    ]);
  });

  it("returns nothing for empty copy", () => {
    expect(parseTooltipText("  \n\n  ")).toEqual([]);
  });
});

describe("paragraphs and code", () => {
  it("joins only the parts that are present", () => {
    expect(paragraphs("One.", false, undefined, "", "Two.")).toBe(
      "One.\n\nTwo.",
    );
  });

  it("wraps a value in backticks and cannot be broken by one inside", () => {
    expect(code("a ÷ b")).toBe("`a ÷ b`");
    expect(parseTooltipText(code("a ` b"))).toEqual([
      [{ kind: "code", value: "a ' b" }],
    ]);
  });
});
