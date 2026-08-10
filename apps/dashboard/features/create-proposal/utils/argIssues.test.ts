import type { AbiParameter } from "viem";

import {
  argIssues,
  isArgComplete,
} from "@/features/create-proposal/utils/argIssues";
import type { ArgValue } from "@/features/create-proposal/utils/argTree";

const param = (type: string, extra: Record<string, unknown> = {}) =>
  ({ name: "value", type, ...extra }) as AbiParameter;

const tuple = (...components: AbiParameter[]) => param("tuple", { components });

const messages = (p: AbiParameter, value: ArgValue) =>
  argIssues(p, value).map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

/* Replaced three passes that answered the same question and disagreed: a boolean
 * `isArgComplete`, a `tupleArityError` that re-walked for a better message, and the
 * JSON import's own pass. This is the contract all three callers now share. */
describe("argIssues", () => {
  describe("leaves", () => {
    it("accepts a value its type can hold", () => {
      expect(argIssues(param("uint256"), "42")).toEqual([]);
    });

    it("calls a blank Required rather than malformed", () => {
      expect(argIssues(param("uint256"), "  ")).toEqual([
        { path: [], message: "Required" },
      ]);
    });

    it("reports a value its type can't hold", () => {
      expect(messages(param("uint8"), "999")).toEqual([
        ": Exceeds uint8 max (255)",
      ]);
    });

    it("refuses a list where a single value belongs", () => {
      expect(messages(param("uint256"), ["1"])).toEqual([
        ": must be a single value for uint256",
      ]);
    });
  });

  describe("arrays", () => {
    it("accepts an empty dynamic array", () => {
      expect(argIssues(param("uint256[]"), [])).toEqual([]);
    });

    it("names the offending element, not the argument", () => {
      expect(messages(param("uint256[]"), ["1", "nope", "3"])).toEqual([
        "1: Must be a non-negative integer (decimal or 0x hex)",
      ]);
    });

    it("holds a fixed array to its declared length", () => {
      expect(messages(param("uint8[3]"), ["1", "2"])).toEqual([
        ": must hold exactly 3 entries for uint8[3], not 2",
      ]);
    });

    it("refuses a value where an array belongs", () => {
      expect(messages(param("uint256[]"), "1")).toEqual([
        ": must be a JSON array for uint256[]",
      ]);
    });
  });

  describe("tuples", () => {
    const durations = tuple(
      param("uint256", { name: "cliff" }),
      param("uint256", { name: "total" }),
    );

    it("accepts a tuple holding exactly its components", () => {
      expect(argIssues(durations, ["100", "500"])).toEqual([]);
    });

    test.each([
      [["100"], ": has 2 fields for tuple but was given 1"],
      [["100", "500", "900"], ": has 2 fields for tuple but was given 3"],
    ])("%j is refused for its arity", (value, expected) => {
      expect(messages(durations, value)).toEqual([expected]);
    });

    it("names children after the components the abi names", () => {
      expect(messages(durations, ["100", ""])).toEqual(["total: Required"]);
    });

    it("reaches a leaf nested two tuples deep", () => {
      const schedule = tuple({ ...durations, name: "durations" });
      expect(messages(schedule, [["1", "nope"]])).toEqual([
        "durations.total: Must be a non-negative integer (decimal or 0x hex)",
      ]);
    });

    it("falls back to the index for an unnamed component", () => {
      expect(messages(tuple(param("uint256", { name: "" })), [""])).toEqual([
        "0: Required",
      ]);
    });

    it("reports the arity instead of the children it can no longer line up", () => {
      expect(messages(durations, ["nope"])).toEqual([
        ": has 2 fields for tuple but was given 1",
      ]);
    });
  });

  describe("isArgComplete", () => {
    it("is the same question as a boolean", () => {
      expect(isArgComplete(param("uint256"), "42")).toBe(true);
      expect(isArgComplete(param("uint256"), "")).toBe(false);
    });
  });
});
