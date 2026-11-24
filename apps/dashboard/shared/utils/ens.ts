import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

const ENS_LOOKUP_TIMEOUT_MS = 5_000;
const TRANSPORT_OPTIONS = { timeout: ENS_LOOKUP_TIMEOUT_MS, retryCount: 1 };

export const isEnsAddress = (value: string): boolean => {
  try {
    normalize(value);
  } catch {
    return false;
  }
  return value.endsWith(".eth") && value.slice(0, -4).length >= 3;
};

/**
 * Mainnet transport for name lookups. In the browser it goes through the
 * dashboard's /api/rpc proxy, which adds the eRPC secret server-side; on the
 * server it calls the same eRPC upstream directly. Without eRPC (local dev)
 * viem's public mainnet endpoint is enough for a one-off lookup.
 */
const getMainnetTransport = () => {
  if (typeof window !== "undefined") {
    return http(
      `${window.location.origin}/api/rpc/${mainnet.id}`,
      TRANSPORT_OPTIONS,
    );
  }

  const erpcUrl = process.env.ERPC_URL;
  const erpcSecret = process.env.ERPC_SECRET;
  if (!erpcUrl || !erpcSecret) return http(undefined, TRANSPORT_OPTIONS);

  return http(`${erpcUrl.replace(/\/+$/, "")}/evm/${mainnet.id}`, {
    ...TRANSPORT_OPTIONS,
    fetchOptions: { headers: { "X-ERPC-Secret-Token": erpcSecret } },
  });
};

/**
 * Resolves an ENS name to its ETH address on mainnet, in the browser or on
 * the server. Returns null when the name has no address, can't be
 * normalized, or the lookup fails or takes longer than 5 seconds.
 */
export const fetchAddressFromEnsName = async ({
  ensName,
}: {
  ensName: `${string}.eth`;
}): Promise<Address | null> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const client = createPublicClient({
      chain: mainnet,
      transport: getMainnetTransport(),
    });
    // A lookup is several RPC calls (and possibly a CCIP-read gateway hop):
    // bound the whole of it so an unresponsive node can't hang the caller.
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("ENS lookup timed out")),
        ENS_LOOKUP_TIMEOUT_MS,
      );
    });

    return await Promise.race([
      client.getEnsAddress({ name: normalize(ensName) }),
      timeout,
    ]);
  } catch (error) {
    console.warn(`Failed to resolve ENS name ${ensName}:`, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
};
