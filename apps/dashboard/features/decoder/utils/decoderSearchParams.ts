import { parseAsInteger, parseAsString } from "nuqs";

/**
 * URL state for /tools/decoder, so any decode is a shareable permalink.
 * The user ABI stays deliberately out of the URL: ABIs run to many KB and
 * would blow past URL limits; the UI says so next to the ABI field.
 *
 * (Kept separate from the pure input helpers in calldataInput.ts: nuqs is
 * ESM-only, which the Jest runner cannot parse.)
 */
export const decoderParsers = {
  calldata: parseAsString.withDefault(""),
  address: parseAsString.withDefault(""),
  chainId: parseAsInteger.withDefault(1),
};
