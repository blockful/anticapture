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

export async function startAnvil(options?: {
  port?: number;
  logs?: boolean;
  forkUrl?: string;
}): Promise<string> {
  const forkUrl = options?.forkUrl ?? process.env["RPC_URL"];
  if (!forkUrl) {
    throw new Error(
      "Fork RPC URL is required. Pass --fork-url to the script or set RPC_URL in apps/relayer/.env.",
    );
  }

  anvilInstance = Instance.anvil(
    {
      forkUrl,
      forkBlockNumber: FORK_BLOCK,
      ...(options?.port !== undefined ? { port: options.port } : {}),
    },
    { timeout: 30_000 },
  );

  if (options?.logs) {
    anvilInstance.on("stdout", (msg) => process.stdout.write(`[anvil] ${msg}`));
    anvilInstance.on("stderr", (msg) => process.stderr.write(`[anvil] ${msg}`));
  }

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
