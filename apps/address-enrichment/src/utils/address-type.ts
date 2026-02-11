import { createPublicClient, http, type Address } from "viem";
import { mainnet } from "viem/chains";

/**
 * Creates a viem public client for checking address types
 */
export function createRpcClient(rpcUrl: string) {
  return createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });
}

/**
 * Checks if an address is a contract or EOA (Externally Owned Account)
 *
 * @param client - viem PublicClient
 * @param address - Ethereum address to check
 * @returns true if contract, false if EOA
 *
 * Logic: Contracts have bytecode, EOAs have empty bytecode (0x)
 */
export async function isContract(
  client: ReturnType<typeof createPublicClient>,
  address: Address,
): Promise<boolean> {
  try {
    const bytecode = await client.getCode({ address });
    // If bytecode exists and is not empty (0x), it's a contract
    return bytecode !== undefined && bytecode !== "0x";
  } catch (error) {
    console.error(`Failed to check address type for ${address}:`, error);
    // Default to false (EOA) on error to be conservative
    return false;
  }
}
