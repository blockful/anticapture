import { getAddress, type Hex } from "viem";

import { humanizeNumber } from "@/shared/services/decoder/humanize/number";
import type { DecodedParam } from "@/shared/services/decoder/types";

/** Words rendered before the remainder collapses into one bytes leaf. */
const MAX_WORDS = 64;

const WORD_HEX_CHARS = 64;

/**
 * Bytes that plausibly encode a call: at least a 4-byte selector followed by
 * whole 32-byte words.
 */
export const looksLikeCalldata = (hex: string): boolean => {
  if (!/^0x[0-9a-fA-F]*$/.test(hex)) return false;
  const byteLength = (hex.length - 2) / 2;
  return byteLength >= 4 && (byteLength - 4) % 32 === 0;
};

const guessWord = (word: string, index: number): DecodedParam => {
  const name = `arg${index}`;
  // 12 leading zero bytes with a non-zero tail is the ABI encoding of an
  // address; a plain small number never has entropy in the low 20 bytes.
  const leading = word.slice(0, 24);
  const tail = word.slice(24);
  if (/^0+$/.test(leading) && !/^0+$/.test(tail)) {
    const value = BigInt(`0x${word}`);
    if (value < 2n ** 64n) {
      return {
        name,
        type: "uint256",
        value: value.toString(),
        humanized: humanizeNumber(value) ?? undefined,
      };
    }
    return {
      name,
      type: "address",
      value: getAddress(`0x${tail}`),
      isAddress: true,
    };
  }
  if (/^0+$/.test(word)) {
    return { name, type: "uint256", value: "0" };
  }
  const value = BigInt(`0x${word}`);
  if (value < 2n ** 64n) {
    return {
      name,
      type: "uint256",
      value: value.toString(),
      humanized: humanizeNumber(value) ?? undefined,
    };
  }
  return { name, type: "bytes32", value: `0x${word}` };
};

/**
 * Best-effort parameter tree for calldata with no known ABI: the post-selector
 * data split into 32-byte words with word-shape-guessed types. Callers pair
 * this with a permanent "guessed types" warning.
 */
export const guessWords = (calldata: Hex): DecodedParam[] => {
  const body = calldata.slice(10); // strip 0x + 4-byte selector
  if (body.length === 0) return [];

  const params: DecodedParam[] = [];
  const wholeWords = Math.floor(body.length / WORD_HEX_CHARS);
  const renderedWords = Math.min(wholeWords, MAX_WORDS);

  for (let i = 0; i < renderedWords; i++) {
    const word = body.slice(i * WORD_HEX_CHARS, (i + 1) * WORD_HEX_CHARS);
    params.push(guessWord(word.toLowerCase(), i));
  }

  const restStart = renderedWords * WORD_HEX_CHARS;
  const rest = body.slice(restStart);
  if (rest.length > 0) {
    params.push({
      name: `arg${renderedWords}`,
      type: "bytes",
      value: `0x${rest}`,
    });
  }

  return params;
};
