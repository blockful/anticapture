import { isAddress } from "viem";

/**
 * What the permalink may carry for the optional target address.
 *
 * Every keystroke in that field reaches the URL, so without a bound the
 * permalink accumulates whatever was typed: a half-written address, a pasted
 * paragraph, an ENS name the decoder cannot use. Only a complete 20-byte
 * address is a target someone else can open the link on, so anything else
 * stores as empty and stays in component state instead.
 *
 * Validated exactly as the field itself validates, so the URL always carries
 * what the reader is being told is valid: a lowercase address passes, a
 * mixed-case one must match its checksum.
 */
export const permalinkAddress = (value: string): string => {
  const trimmed = value.trim();
  return isAddress(trimmed) ? trimmed : "";
};
