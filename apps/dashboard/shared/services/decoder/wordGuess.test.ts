import type { Hex } from "viem";

import {
  guessWords,
  looksLikeCalldata,
} from "@/shared/services/decoder/wordGuess";

const SELECTOR = "0xa9059cbb";
const word = (hex: string) => hex.padStart(64, "0");

const calldata = (...words: string[]): Hex =>
  `${SELECTOR}${words.join("")}` as Hex;

describe("looksLikeCalldata", () => {
  test("accepts a selector plus whole words", () => {
    expect(looksLikeCalldata(calldata(word("1"), word("2")))).toBe(true);
  });

  test("accepts a bare selector", () => {
    expect(looksLikeCalldata(SELECTOR)).toBe(true);
  });

  test("rejects data not aligned to 32-byte words", () => {
    expect(looksLikeCalldata(`${SELECTOR}abcd`)).toBe(false);
  });

  test("rejects short and non-hex input", () => {
    expect(looksLikeCalldata("0x01")).toBe(false);
    expect(looksLikeCalldata("not-hex")).toBe(false);
  });
});

describe("guessWords", () => {
  test("an address-shaped word becomes a checksummed address", () => {
    const address = "dac17f958d2ee523a2206206994597c13d831ec7";
    const [param] = guessWords(calldata(word(address)));
    expect(param).toMatchObject({
      name: "arg0",
      type: "address",
      isAddress: true,
    });
    expect(param.value.toLowerCase()).toBe(`0x${address}`);
    // Checksummed, not lowercased.
    expect(param.value).not.toBe(`0x${address}`);
  });

  test("an 18-decimal token amount reads as a number, not an address", () => {
    // 100e18 has 12+ leading zero bytes but is a value, not an address: only
    // top-heavy 20-byte words (>= 2^152) read as addresses.
    const amount = (100n * 10n ** 18n).toString(16);
    const [param] = guessWords(calldata(word(amount)));
    expect(param).toMatchObject({ type: "uint256" });
    expect(param.value).toBe((100n * 10n ** 18n).toString());
    expect(param.isAddress).toBeUndefined();
  });

  test("a small value reads as uint256 with grouping", () => {
    const [param] = guessWords(calldata(word("f4240"))); // 1,000,000
    expect(param).toMatchObject({ name: "arg0", type: "uint256" });
    expect(param.value).toBe("1000000");
    expect(param.humanized?.text).toBe("1,000,000");
  });

  test("an all-zero word is uint256 zero", () => {
    const [param] = guessWords(calldata(word("0")));
    expect(param).toMatchObject({ type: "uint256", value: "0" });
  });

  test("a high-entropy word stays bytes32", () => {
    const entropy = "deadbeef".repeat(8);
    const [param] = guessWords(calldata(entropy));
    expect(param).toMatchObject({ type: "bytes32", value: `0x${entropy}` });
  });

  test("a trailing partial word becomes a bytes leaf", () => {
    const params = guessWords(`${calldata(word("1"))}abcd` as Hex);
    expect(params).toHaveLength(2);
    expect(params[1]).toMatchObject({
      name: "arg1",
      type: "bytes",
      value: "0xabcd",
    });
  });

  test("caps rendering at 64 words and collapses the remainder", () => {
    const words = Array.from({ length: 70 }, () => word("1"));
    const params = guessWords(calldata(...words));
    expect(params).toHaveLength(65);
    expect(params[64].type).toBe("bytes");
    expect(params[64].value.length).toBe(2 + 6 * 64);
  });

  test("empty body yields no params", () => {
    expect(guessWords(SELECTOR as Hex)).toEqual([]);
  });
});
