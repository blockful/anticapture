import {
  formatJsonPath,
  parseJsonDocument,
  rangeOfLine,
} from "@/features/create-proposal/utils/jsonSource";

const expectParsed = (text: string) => {
  const result = parseJsonDocument(text);
  if (!result.ok) throw new Error(`expected a parse, got line ${result.line}`);
  return result.document;
};

describe("formatJsonPath", () => {
  test.each([
    [[], ""],
    [["title"], "title"],
    [["actions", 1, "amount"], "actions[1].amount"],
    [
      ["actions", 9, "args", 0, "durations", "total"],
      "actions[9].args[0].durations.total",
    ],
  ])("%j", (path, expected) => {
    expect(formatJsonPath(path as (string | number)[])).toBe(expected);
  });
});

describe("parseJsonDocument", () => {
  describe("numbers", () => {
    /*
     * The reason this file exists. `JSON.parse` hands back a double, so
     * `1000000000000000001` arrives as `…000` and `1.000000000000000001` as plain
     * `1` — and every figure in a proposal ends up at `parseUnits` or the ABI
     * encoder, both of which take text.
     *
     * Spliced as raw text: written as TS literals the compiler rounds them first.
     */
    test.each([
      ["an integer past 2^53", "1000000000000000001"],
      ["a fraction a double collapses", "1.000000000000000001"],
      ["a fraction beyond a double", "0.123456789123456789"],
      ["a figure a double carries exactly", "1.5"],
      ["a negative", "-42"],
      ["exponent notation, as written", "1e3"],
    ])("keeps %s as the text it was written as", (_label, literal) => {
      expect(expectParsed(`{"n": ${literal}}`).value).toEqual({ n: literal });
    });

    it("keeps a number nested in arrays and objects", () => {
      expect(expectParsed('{"a": [[1], {"b": 2}], "c": "x"}').value).toEqual({
        a: [["1"], { b: "2" }],
        c: "x",
      });
    });

    it("leaves the other JSON kinds alone", () => {
      expect(expectParsed('{"t": true, "n": null, "s": "1"}').value).toEqual({
        t: true,
        n: null,
        s: "1",
      });
    });
  });

  describe("lines", () => {
    // Laid out so the amount lands on line 8, as the status row claims.
    const document = `{
  "title": "Proposal title",
  "actions": [
    {"type": "eth-transfer", "recipient": "0x0", "amount": "600"},
    {"type": "erc20-transfer",
     "recipient": "0x1",
     "tokenAddress": "0x2",
     "amount": 480000}
  ]
}`;

    test.each([
      [[], 1],
      [["title"], 2],
      [["actions"], 3],
      [["actions", 0, "amount"], 4],
      [["actions", 1], 5],
      [["actions", 1, "tokenAddress"], 7],
      [["actions", 1, "amount"], 8],
    ])("%j is on line %i", (path, expected) => {
      expect(expectParsed(document).lineOf(path as (string | number)[])).toBe(
        expected,
      );
    });

    it("has nothing to say about a path the document doesn't carry", () => {
      expect(expectParsed(document).lineOf(["body"])).toBeUndefined();
    });

    it("counts from the start of what was pasted, blank lines included", () => {
      expect(
        expectParsed(`\n\n${document}`).lineOf(["actions", 1, "amount"]),
      ).toBe(10);
    });
  });

  describe("refusals", () => {
    /*
     * A pasted proposal is meant to be machine-generated, so a comment or a
     * trailing comma is refused rather than tolerated: accepting one here would
     * take a document that other tools will reject.
     */
    test.each([
      ["a missing value", '{"a":}', 1],
      ["a trailing comma", '{"a":1,}', 1],
      ["a comment", '{\n  "a": 1 // note\n}', 2],
      ["single quotes", "{'a':1}", 1],
      ["a truncated document", '{"a": [1, 2', 1],
    ])("refuses %s, and says which line", (_label, text, line) => {
      const result = parseJsonDocument(text);
      expect(result).toMatchObject({ ok: false, line });
    });
  });
});

describe("rangeOfLine", () => {
  const text = "a\nbb\nccc";

  test.each([
    [1, { start: 0, end: 1 }],
    [2, { start: 2, end: 4 }],
    [3, { start: 5, end: 8 }],
    [99, { start: 5, end: 8 }],
  ])("line %i", (line, expected) => {
    expect(rangeOfLine(text, line)).toEqual(expected);
  });
});
