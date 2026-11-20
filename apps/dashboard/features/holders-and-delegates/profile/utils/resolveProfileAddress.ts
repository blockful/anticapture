import { cache } from "react";
import type { Address } from "viem";
import { createPublicClient, getAddress, http, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

import { isEnsAddress } from "@/shared/utils/ens";

export type ProfileAddressParam =
  | { kind: "address"; address: Address }
  | { kind: "ens"; address: Address }
  | { kind: "invalid" };

const ENS_LOOKUP_TIMEOUT_MS = 5_000;

// Same upstream as the /api/rpc proxy. Without eRPC (local dev) viem's public
// mainnet endpoint is enough for a one-off name lookup.
const getMainnetTransport = () => {
  const erpcUrl = process.env.ERPC_URL;
  const erpcSecret = process.env.ERPC_SECRET;

  if (!erpcUrl || !erpcSecret) {
    return http(undefined, { timeout: ENS_LOOKUP_TIMEOUT_MS, retryCount: 1 });
  }

  return http(`${erpcUrl.replace(/\/+$/, "")}/evm/${mainnet.id}`, {
    timeout: ENS_LOOKUP_TIMEOUT_MS,
    retryCount: 1,
    fetchOptions: { headers: { "X-ERPC-Secret-Token": erpcSecret } },
  });
};

const resolveEnsName = async (name: string): Promise<Address | null> => {
  try {
    const client = createPublicClient({
      chain: mainnet,
      transport: getMainnetTransport(),
    });
    // The lookup is several RPC calls; bound the whole of it, not each one,
    // so an unresponsive node turns into a 404 instead of a hung page.
    return await Promise.race([
      client.getEnsAddress({ name: normalize(name) }),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), ENS_LOOKUP_TIMEOUT_MS),
      ),
    ]);
  } catch (error) {
    console.error(`Failed to resolve ENS name ${name}`, error);
    return null;
  }
};

/**
 * Reads the `[address]` segment of a profile URL. A 0x address is accepted in
 * any casing; a `.eth` name is resolved so the caller can redirect to the
 * canonical 0x URL. Anything else, an unresolvable name included, is invalid.
 * Cached per request: metadata and the page both read the same segment.
 */
export const resolveProfileAddressParam = cache(
  async (rawParam: string): Promise<ProfileAddressParam> => {
    let value: string;
    try {
      value = decodeURIComponent(rawParam).trim();
    } catch {
      return { kind: "invalid" };
    }

    if (isAddress(value, { strict: false })) {
      return { kind: "address", address: getAddress(value) };
    }

    const ensName = value.toLowerCase();
    if (!isEnsAddress(ensName)) return { kind: "invalid" };

    const resolved = await resolveEnsName(ensName);

    return resolved && isAddress(resolved, { strict: false })
      ? { kind: "ens", address: getAddress(resolved) }
      : { kind: "invalid" };
  },
);
