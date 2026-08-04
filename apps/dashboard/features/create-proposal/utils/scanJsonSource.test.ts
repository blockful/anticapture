import {
  formatJsonPath,
  lineAtOffset,
  lineFromParseError,
  scanJsonSource,
} from "@/features/create-proposal/utils/scanJsonSource";

describe("formatJsonPath", () => {
  test.each([
    [[], ""],
    [["title"], "title"],
    [["actions", 1, "amount"], "actions[1].amount"],
    [
      ["actions", 9, "args", 0, "durations", "total"],
      "actions[9].args[0].durations.total",
    ],
  ])("%j → %s", (path, expected) => {
    expect(formatJsonPath(path as (string | number)[])).toBe(expected);
  });
});

describe("scanJsonSource", () => {
  // The document from the review, laid out so the unquoted 480000 lands on
  // line 7 exactly as the status-row copy claims.
  const document = `{
  "title": "Proposal title",
  "actions": [
    {"type": "eth-transfer", "recipient": "0x0", "amount": "600"},
    {"type": "erc20-transfer",
     "tokenAddress": "0x1",
     "amount": 480000},
    {"type": "custom", "calldata": "0x2"}
  ]
}`;

  test("puts the unquoted figure on the line it was written", () => {
    const sources = scanJsonSource(document);
    expect(sources.get("actions[1].amount")).toEqual({
      line: 7,
      numberLiteral: "480000",
    });
  });

  test("keeps digits JSON.parse would have rounded away", () => {
    const sources = scanJsonSource('{"amount": 1000000000000000000001}');
    // The parsed number is 1e21; the text said something else.
    expect(JSON.parse('{"amount": 1000000000000000000001}').amount).toBe(1e21);
    expect(sources.get("amount")?.numberLiteral).toBe("1000000000000000000001");
  });

  test("records containers and strings too, for their line", () => {
    const sources = scanJsonSource(document);
    expect(sources.get("")?.line).toBe(1);
    expect(sources.get("title")?.line).toBe(2);
    expect(sources.get("actions")?.line).toBe(3);
    expect(sources.get("actions[2]")?.line).toBe(8);
    // A string carries no literal: the parsed value already reproduces it.
    expect(sources.get("title")?.numberLiteral).toBeUndefined();
  });

  test.each([
    ["negative", "-12"],
    ["fractional", "1.5"],
    ["exponent", "1e21"],
    ["signed exponent", "-1.5E-3"],
  ])("keeps a %s literal verbatim", (_label, literal) => {
    expect(scanJsonSource(`{"n": ${literal}}`).get("n")?.numberLiteral).toBe(
      literal,
    );
  });

  test("handles escapes without losing its place", () => {
    const text = `{\n  "body": "line\\none\\ttwo \\"quoted\\" \\u00e9 \\\\ done",\n  "after": 1\n}`;
    const sources = scanJsonSource(text);
    // The escaped \n is two characters in the source, not a line break.
    expect(sources.get("after")?.line).toBe(3);
  });

  test("uses the decoded key as the path segment", () => {
    const sources = scanJsonSource('{"a\\u002eb": 1}');
    expect(sources.has("a.b")).toBe(true);
  });

  test.each([
    ["empty containers", '{"a": {}, "b": [], "c": 1}'],
    ["nested arrays", '{"a": [[1, 2], [3]], "b": 4}'],
    ["literals", '{"t": true, "f": false, "n": null, "x": 5}'],
  ])("walks %s to the end", (_label, text) => {
    // A scan that gave up returns an empty map, so a populated one means the
    // walk reached the closing brace.
    expect(scanJsonSource(text).size).toBeGreaterThan(0);
  });

  test.each([
    ["a bare value", "42"],
    ["an array root", "[1, 2]"],
  ])("scans %s", (_label, text) => {
    expect(scanJsonSource(text).size).toBeGreaterThan(0);
  });

  describe("gives up rather than guessing", () => {
    test.each([
      ["malformed json", '{"a": }'],
      ["a trailing comma", '{"a": 1,}'],
      ["an unterminated string", '{"a": "x'],
      ["a single-quoted key", "{'a': 1}"],
      ["trailing content", '{"a": 1} extra'],
      ["a bad unicode escape", '{"a": "\\uZZZZ"}'],
      ["a lone minus", '{"a": -}'],
    ])("%s", (_label, text) => {
      expect(scanJsonSource(text).size).toBe(0);
    });
  });

  // The scanner must never disagree with the parser about a document's shape,
  // because callers look up paths the parser's validation produced.
  test("agrees with JSON.parse about which paths exist", () => {
    const text = JSON.stringify(
      {
        title: "t",
        nested: { deep: { deeper: [1, "two", { three: 3 }] } },
        actions: [{ type: "custom", args: ["1", ["2", "3"], { k: "4" }] }],
      },
      null,
      2,
    );
    const sources = scanJsonSource(text);

    const walk = (value: unknown, path: (string | number)[]) => {
      expect(sources.has(formatJsonPath(path))).toBe(true);
      if (Array.isArray(value)) {
        value.forEach((item, i) => walk(item, [...path, i]));
        return;
      }
      if (value && typeof value === "object") {
        for (const [key, item] of Object.entries(value)) {
          walk(item, [...path, key]);
        }
      }
    };
    walk(JSON.parse(text), []);
  });
});

describe("lineAtOffset", () => {
  const text = "a\nbb\nccc";

  test.each([
    [0, 1],
    [1, 1],
    [2, 2],
    [5, 3],
    [999, 3],
    [-5, 1],
  ])("offset %i → line %i", (offset, line) => {
    expect(lineAtOffset(text, offset)).toBe(line);
  });
});

describe("lineFromParseError", () => {
  const text = "a\nbb\nccc\ndddd";

  test.each([
    // V8's positional wording, which states the line outright.
    [
      "a reported line",
      "Expected ',' in JSON at position 5 (line 3 column 1)",
      3,
    ],
    // Engines that give an offset but no line.
    ["an offset alone", "Unexpected token in JSON at position 5", 3],
    // V8's other wording, which inlines the document and gives neither.
    [
      "neither",
      `Unexpected token '}', "{ \\"a\\": }" is not valid JSON`,
      undefined,
    ],
    ["a non-Error", "", undefined],
  ])("%s", (_label, message, expected) => {
    const error = message ? new Error(message) : "not an error at all";
    expect(lineFromParseError(text, error)).toBe(expected);
  });

  // Whatever this engine's wording turns out to be, the answer has to be either
  // a line inside the document or nothing, never a line past its end.
  test("never points past the end of the document", () => {
    const document = '{\n  "a": 1,\n  "b":\n}';
    let error: unknown;
    try {
      JSON.parse(document);
    } catch (e) {
      error = e;
    }
    const line = lineFromParseError(document, error);
    if (line !== undefined) {
      expect(line).toBeLessThanOrEqual(document.split("\n").length);
      expect(line).toBeGreaterThanOrEqual(1);
    }
  });
});
