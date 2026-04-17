import { Instance } from "prool";
import {
  createTestClient,
  createWalletClient,
  http,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

import { FORK_BLOCK, TEST_USER_KEY } from "./constants";

// --- Anvil lifecycle ---

let anvilInstance: Instance.Instance | undefined;

export async function startAnvil(): Promise<string> {
  const forkUrl = process.env["RPC_URL"];
  if (!forkUrl) {
    throw new Error("FORK_RPC_URL (or RPC_URL) env var is required.");
  }

  anvilInstance = Instance.anvil(
    { forkUrl, forkBlockNumber: FORK_BLOCK },
    { timeout: 30_000 },
  );

  await anvilInstance.start();
  return `http://${anvilInstance.host}:${anvilInstance.port}`;
}

export async function stopAnvil() {
  await anvilInstance?.stop();
  anvilInstance = undefined;
}

// --- viem clients ---

export function createClients(rpcUrl: string) {
  const testClient = createTestClient({
    mode: "anvil",
    transport: http(rpcUrl),
    chain: mainnet,
  }).extend(publicActions);

  const walletClient = createWalletClient({
    account: privateKeyToAccount(TEST_USER_KEY),
    transport: http(rpcUrl),
    chain: mainnet,
  });

  return { testClient, walletClient };
}
