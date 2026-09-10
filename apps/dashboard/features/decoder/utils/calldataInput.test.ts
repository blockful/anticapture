import {
  isValidCalldataInput,
  normalizeCalldataInput,
} from "@/features/decoder/utils/calldataInput";

describe("normalizeCalldataInput", () => {
  test("strips whitespace and newlines from explorer pastes", () => {
    expect(normalizeCalldataInput("0xa905\n9cbb 0000\t11")).toBe(
      "0xa9059cbb000011",
    );
  });

  test("leaves clean input untouched", () => {
    expect(normalizeCalldataInput("0xa9059cbb")).toBe("0xa9059cbb");
  });
});

describe("isValidCalldataInput", () => {
  test("accepts 0x-prefixed even-length hex", () => {
    expect(isValidCalldataInput("0xa9059cbb")).toBe(true);
    expect(isValidCalldataInput("0x")).toBe(true);
  });

  test("rejects odd length, missing prefix and non-hex", () => {
    expect(isValidCalldataInput("0xa9059cb")).toBe(false);
    expect(isValidCalldataInput("a9059cbb")).toBe(false);
    expect(isValidCalldataInput("0xzz")).toBe(false);
  });
});
