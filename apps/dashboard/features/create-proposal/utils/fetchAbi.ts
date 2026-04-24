import type { Abi } from "viem";
import { z } from "zod";

const ETHERSCAN_V2_ENDPOINT = "https://api.etherscan.io/v2/api";

// Minimal structural validation for an ABI: an array of objects each with a
// string `type` field. Extra keys are allowed (ABI items carry many shapes:
// function, event, error, constructor, fallback, receive) — we preserve them
// via .passthrough(). viem's decoders validate the rest at use-time.
const AbiItemSchema = z.object({ type: z.string() }).passthrough();
const AbiSchema = z.array(AbiItemSchema);

export const parseAbiStrict = (value: unknown): Abi | null => {
  const result = AbiSchema.safeParse(value);
  if (!result.success) return null;
  // Zod's inferred output type is a loose record because we use
  // .passthrough() — the structural guarantee (array of objects with a
  // string `type`) is exactly the contract viem needs to pick the right
  // decoder per item at call time. Cast at the boundary only.
  return result.data as unknown as Abi;
};

const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

type EtherscanResponse = {
  status: string;
  message: string;
  result: string;
};

/**
 * Fetches a verified contract ABI from Etherscan v2. Returns null when:
 * - the address is malformed
 * - NEXT_PUBLIC_ETHERSCAN_API_KEY is not set
 * - the contract is not verified on Etherscan
 * - the response is malformed
 */
export const fetchAbi = async (
  chainId: number,
  address: string,
): Promise<Abi | null> => {
  if (!isValidAddress(address)) return null;
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    chainid: String(chainId),
    module: "contract",
    action: "getabi",
    address,
    apikey: apiKey,
  });
  const res = await fetch(`${ETHERSCAN_V2_ENDPOINT}?${params.toString()}`);
  if (!res.ok) return null;

  const json = (await res.json()) as EtherscanResponse;
  if (json.status !== "1") return null;

  try {
    const parsed: unknown = JSON.parse(json.result);
    return parseAbiStrict(parsed);
  } catch {
    return null;
  }
};
