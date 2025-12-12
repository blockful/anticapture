import { createParser } from "nuqs";
import { isAddress } from "viem";

export const parseAsAddress = createParser({
  parse(queryValue) {
    const isValid = isAddress(queryValue);
    if (!isValid) return null;
    return queryValue;
  },
  serialize(value) {
    return value;
  },
});
