import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  publicActions,
  walletActions,
  type Address,
  type PublicClient,
  type TestClient,
  type WalletClient,
} from "viem";
import { mainnet } from "viem/chains";

export interface ForkHandle {
  rpcUrl: string;
  publicClient: PublicClient;
  testClient: TestClient;
  walletClient: WalletClient;
  stop: () => void;
}

const findAnvilBinary = (): string => {
  if (process.env.ANVIL_PATH) return process.env.ANVIL_PATH;

  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [
    "anvil",
  ]);
  if (probe.status === 0) {
    const found = probe.stdout.toString().split(/\r?\n/)[0]?.trim();
    if (found) return found;
  }

  const fallback = join(
    homedir(),
    ".foundry",
    "bin",
    process.platform === "win32" ? "anvil.exe" : "anvil",
  );
  if (existsSync(fallback)) return fallback;

  throw new Error(
    "anvil not found. Install foundry (https://getfoundry.sh) or set ANVIL_PATH.",
  );
};

const waitForRpc = async (rpcUrl: string, child: ChildProcess) => {
  const deadline = Date.now() + 120_000;
  let exited = false;
  child.on("exit", () => {
    exited = true;
  });

  while (Date.now() < deadline) {
    if (exited) throw new Error("anvil exited before the RPC came up");
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_blockNumber",
          params: [],
        }),
      });
      const body = (await res.json()) as { result?: string };
      if (body.result) return;
    } catch {
      // node not up yet, retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("anvil did not become ready within 120s");
};

export const startFork = async ({
  forkUrl,
  port,
}: {
  forkUrl: string;
  port: number;
}): Promise<ForkHandle> => {
  const anvil = findAnvilBinary();
  const rpcUrl = `http://127.0.0.1:${port}`;

  // Authenticated RPC URLs carry API keys in the path or query string, so
  // never log the full URL; the host is enough to identify the provider.
  let forkHost: string;
  try {
    forkHost = new URL(forkUrl).host;
  } catch {
    forkHost = "<unparseable fork url>";
  }
  console.log(`  starting anvil fork of ${forkHost} on :${port} ...`);
  const child = spawn(
    anvil,
    [
      "--fork-url",
      forkUrl,
      "--port",
      String(port),
      "--auto-impersonate",
      // Voting periods mean mining tens of thousands of blocks; pruning
      // historical state makes that several times faster and the harness only
      // ever reads latest state.
      "--prune-history",
      "--silent",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  let stderr = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  // Anvil connection errors echo the fork URL, so redact stderr before it
  // reaches any log or error message.
  const redactedStderr = () => stderr.trim().split(forkUrl).join(forkHost);
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`  anvil exited with code ${code}: ${redactedStderr()}`);
    }
  });

  try {
    await waitForRpc(rpcUrl, child);
    if (child.exitCode !== null) {
      throw new Error(
        `anvil exited immediately (port ${port} already in use?): ${redactedStderr()}`,
      );
    }
  } catch (error) {
    child.kill();
    throw error instanceof Error && stderr
      ? new Error(`${error.message}\n${redactedStderr()}`)
      : error;
  }

  const transport = http(rpcUrl, { timeout: 600_000 });
  const publicClient = createPublicClient({ chain: mainnet, transport });
  const testClient = createTestClient({
    mode: "anvil",
    chain: mainnet,
    transport,
  });
  const walletClient = createWalletClient({ chain: mainnet, transport });

  return {
    rpcUrl,
    publicClient,
    testClient,
    walletClient,
    stop: () => child.kill(),
  };
};

/** Give an account gas money. Impersonation is handled by --auto-impersonate. */
export const fundAccount = async (fork: ForkHandle, address: Address) => {
  await fork.testClient.setBalance({ address, value: 100n * 10n ** 18n });
};

/**
 * Governor timing is measured in blocks, so voting delays/periods mean mining
 * tens of thousands of empty blocks. Chunked so no single RPC call times out
 * and progress stays visible.
 */
export const mineBlocks = async (fork: ForkHandle, blocks: number) => {
  const chunkSize = 5_000;
  let remaining = blocks;
  while (remaining > 0) {
    const chunk = Math.min(chunkSize, remaining);
    await fork.testClient.mine({ blocks: chunk });
    remaining -= chunk;
    if (blocks > chunkSize) {
      console.log(`    mined ${blocks - remaining}/${blocks} blocks`);
    }
  }
};

export const advanceTime = async (fork: ForkHandle, seconds: number) => {
  await fork.testClient.increaseTime({ seconds });
  await fork.testClient.mine({ blocks: 1 });
};

/** A wallet client that can both read and write, as the dashboard helpers expect. */
export const extendedWalletClient = (fork: ForkHandle) =>
  fork.walletClient.extend(publicActions).extend(walletActions);
