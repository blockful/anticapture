import {
  describeImportIssues,
  describeValidImport,
} from "@/features/create-proposal/utils/importIssueCopy";
import type { ImportIssue } from "@/features/create-proposal/utils/parseProposalJson";

const issue = (overrides: Partial<ImportIssue> = {}): ImportIssue => ({
  path: ["actions", 1, "amount"],
  message: "must be quoted: a JSON number can silently change the value",
  line: 7,
  numberLiteral: "480000",
  ...overrides,
});

describe("describeValidImport", () => {
  test.each([
    [3, "Valid · 3 actions"],
    [1, "Valid · 1 action"],
    [0, "Valid · 0 actions"],
    [undefined, "Valid"],
  ])("%s actions → %s", (count, expected) => {
    expect(describeValidImport(count)).toBe(expected);
  });
});

describe("describeImportIssues", () => {
  // The three strings from MOD-11, which the status row has to be able to say.
  test("one problem reads as the design specifies", () => {
    expect(describeImportIssues([issue()])).toBe(
      "Line 7 · unquoted number 480000 must be quoted",
    );
  });

  test("several problems lead with the count and still name the first", () => {
    expect(
      describeImportIssues([issue(), issue({ line: 9 }), issue({ line: 11 })]),
    ).toBe("3 problems · first on line 7 · unquoted number 480000");
  });

  test("falls back to the full message when no figure is involved", () => {
    expect(
      describeImportIssues([
        issue({
          message: "Required",
          numberLiteral: undefined,
          path: ["actions", 0, "args", 0, "total"],
        }),
      ]),
    ).toBe("Line 7 · actions[0].args[0].total: Required");
  });

  test("drops the line when the text couldn't be located", () => {
    expect(
      describeImportIssues([
        issue({
          line: undefined,
          numberLiteral: undefined,
          message: "This isn't valid JSON.",
          path: [],
        }),
      ]),
    ).toBe("This isn't valid JSON.");
  });

  test("still counts several problems with no line to point at", () => {
    const anonymous = issue({
      line: undefined,
      numberLiteral: undefined,
      path: [],
      message: "broken",
    });
    expect(describeImportIssues([anonymous, anonymous])).toBe(
      "2 problems · broken",
    );
  });

  test("says nothing when there is nothing wrong", () => {
    expect(describeImportIssues([])).toBe("");
  });
});
