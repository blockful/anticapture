/** Strips the whitespace and newlines explorers wrap pasted input data in. */
export const normalizeCalldataInput = (value: string): string =>
  value.replace(/\s+/g, "");

/** 0x-prefixed hex with whole bytes: decodable input, whatever the length. */
export const isValidCalldataInput = (value: string): boolean =>
  /^0x[0-9a-fA-F]*$/.test(value) && value.length % 2 === 0;
