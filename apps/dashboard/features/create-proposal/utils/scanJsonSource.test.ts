import {
  formatJsonPath,
  lineFromParseError,
  rangeOfLine,
  scanJsonNumbers,
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
  ])("%j", (path, expected) => {
    expect(formatJsonPath(path as (string | number)[])).toBe(expected);
  });
});

describe("scanJsonNumbers", () => {
  // Laid out so the unquoted 480000 lands on line 7, as the status row claims.
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

  test("finds an unquoted figure by path, with its line and digits", () => {
    expect(scanJsonNumbers(document).get("actions[1].amount")).toEqual({
      line: 7,
      literal: "480000",
    });
  });

  test("keeps digits JSON.parse would have rounded away", () => {
    expect(
      scanJsonNumbers('{"amount": 1000000000000000000001}').get("amount")
        ?.literal,
    ).toBe("1000000000000000000001");
  });

  test("reports only numbers, not strings or containers", () => {
    const found = scanJsonNumbers(document);
    expect([...found.keys()]).toEqual(["actions[1].amount"]);
  });

  test.each([
    ["negative", "-12"],
    ["fractional", "1.5"],
    ["exponent", "1e21"],
    ["signed exponent", "-1.5E-3"],
  ])("keeps a %s literal verbatim", (_label, literal) => {
    expect(scanJsonNumbers(`{"n": ${literal}}`).get("n")?.literal).toBe(
      literal,
    );
  });

  test("counts lines past escapes, not through them", () => {
    const text = `{\n  "body": "a\\nb \\"q\\" \\u00e9 \\\\ done",\n  "n": 1\n}`;
    expect(scanJsonNumbers(text).get("n")?.line).toBe(3);
  });

  test("walks nested containers", () => {
    const found = scanJsonNumbers('{"a": [[1], {"b": 2}], "c": "x"}');
    expect([...found.keys()]).toEqual(["a[0][0]", "a[1].b"]);
  });

  describe("gives up rather than guessing", () => {
    test.each([
      ["malformed json", '{"a": }'],
      ["a trailing comma", '{"a": 1,}'],
      ["an unterminated string", '{"a": "x'],
      ["trailing content", '{"a": 1} extra'],
    ])("%s", (_label, text) => {
      expect(scanJsonNumbers(text).size).toBe(0);
    });
  });
});

describe("lineFromParseError", () => {
  test.each([
    ["a reported line", "Expected ',' at position 5 (line 3 column 1)", 3],
    ["an offset alone", "Unexpected token in JSON at position 5", 3],
    ["neither", `Unexpected token '}', "{}" is not valid JSON`, undefined],
  ])("%s", (_label, message, expected) => {
    expect(lineFromParseError("a\nbb\nccc\ndddd", new Error(message))).toBe(
      expected,
    );
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
