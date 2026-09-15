import type { Abi } from "viem";

import { isRecord } from "@/shared/services/decoder/guards";

/**
 * Minimal structural validation for an ABI: an array of objects each with a
 * string `type` field. Extra keys are kept as they are, since ABI items carry
 * many shapes (function, event, error, constructor, fallback, receive) and
 * viem's decoders validate the rest at use time. A predicate rather than a
 * schema, so the value reaches viem as the object it already is.
 */
const isAbi = (value: unknown): value is Abi =>
  Array.isArray(value) &&
  value.every((item) => isRecord(item) && typeof item.type === "string");

export const parseAbiStrict = (value: unknown): Abi | null =>
  isAbi(value) ? value : null;

const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

type EtherscanResponse = {
  status: string;
  result: string;
};

/** The proxy answers with whatever upstream said, so the shape is tested. */
const isEtherscanResponse = (value: unknown): value is EtherscanResponse =>
  isRecord(value) &&
  typeof value.status === "string" &&
  typeof value.result === "string";

/**
 * Fetches a verified contract ABI via the server-side Etherscan proxy. Returns
 * null when:
 * - the address is malformed
 * - the request itself fails (network or proxy outage)
 * - the proxy is not configured (missing ETHERSCAN_API_KEY on the server)
 * - the contract is not verified on Etherscan
 * - the response is malformed
 *
 * Never throws: a transport failure must degrade to the next ABI source
 * (uploaded, OpenChain, word guess), not reject the whole decode.
 */
export const fetchVerifiedAbi = async (
  chainId: number,
  address: string,
): Promise<Abi | null> => {
  if (!isValidAddress(address)) return null;

  const params = new URLSearchParams({
    chainid: String(chainId),
    address,
  });

  try {
    // A hung upstream must not pin decode consumers on a loading state.
    const res = await fetch(`/api/etherscan?${params.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;

    const json: unknown = await res.json();
    if (!isEtherscanResponse(json) || json.status !== "1") return null;

    const parsed: unknown = JSON.parse(json.result);
    return parseAbiStrict(parsed);
  } catch {
    return null;
  }
};
