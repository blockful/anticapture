import "dotenv/config";
import { parseArgs } from "node:util";
import {
  type Address,
  formatEther,
  formatUnits,
  isAddress,
  parseEther,
  parseUnits,
} from "viem";

import { erc20VotesAbi } from "@/abi/token";

import {
  GOVERNOR_ADDRESS,
  PROPOSER_ADDRESS,
  RELAYER_ADDRESS,
  RELAYER_KEY,
  TOKEN_ADDRESS,
  activateProposal,
  createClients,
  createNoOpProposal,
  fundFromWhale,
  selfDelegate,
  startAnvil,
  stopAnvil,
} from "../e2e/helpers";

interface ParsedArgs {
  wallet: Address;
  port: number;
  forkUrl: string | undefined;
  ensAmount: bigint;
  ethAmount: bigint;
  ensDisplay: string;
  ethDisplay: string;
  selfDelegate: boolean;
}

function parseCliArgs(): ParsedArgs {
  const { values } = parseArgs({
    options: {
      wallet: { type: "string" },
      port: { type: "string", default: "8545" },
      "fork-url": { type: "string" },
      ens: { type: "string", default: "10000" },
      eth: { type: "string", default: "10" },
      "self-delegate": { type: "boolean", default: false },
    },
    allowPositionals: false,
  });

  if (!values.wallet || !isAddress(values.wallet)) {
    throw new Error(
      "--wallet <0x...> is required and must be a valid Ethereum address",
    );
  }
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `--port must be an integer in [1, 65535], got ${values.port}`,
    );
  }

  const forkUrl = values["fork-url"];
  if (forkUrl !== undefined && !/^https?:\/\//.test(forkUrl)) {
    throw new Error(`--fork-url must be an http(s) URL, got ${forkUrl}`);
  }

  const ensDisplay = values.ens!;
  const ethDisplay = values.eth!;
  if (!/^\d+(\.\d+)?$/.test(ensDisplay)) {
    throw new Error(`--ens must be a positive number, got ${ensDisplay}`);
  }
  if (!/^\d+(\.\d+)?$/.test(ethDisplay)) {
    throw new Error(`--eth must be a positive number, got ${ethDisplay}`);
  }

  return {
    wallet: values.wallet as Address,
    port,
    forkUrl,
    ensAmount: parseUnits(ensDisplay, 18),
    ethAmount: parseEther(ethDisplay),
    ensDisplay,
    ethDisplay,
    selfDelegate: values["self-delegate"] ?? false,
  };
}

interface SummaryArgs {
  rpcUrl: string;
  wallet: Address;
  ethDisplay: string;
  ensDisplay: string;
  proposalId: bigint;
  selfDelegated: boolean;
}

function printSummary(args: SummaryArgs): void {
  const { rpcUrl, wallet, ethDisplay, ensDisplay, proposalId, selfDelegated } =
    args;
  const lines = [
    "",
    "✓ Anvil fork ready",
    "",
    `  RPC URL:        ${rpcUrl}`,
    `  Chain ID:       1`,
    `  Fork block:     21630000`,
    "",
    `  Your wallet:    ${wallet}`,
    `    ETH balance:  ${ethDisplay}`,
    `    ENS balance:  ${ensDisplay}`,
    selfDelegated
      ? `    Delegated:    yes (self-delegated — vote button should be enabled)`
      : `    Delegated:    no  (delegate via the dashboard to enable voting)`,
    "",
    `  Active proposal:`,
    `    proposalId (dec): ${proposalId.toString()}`,
    `    proposalId (hex): 0x${proposalId.toString(16)}`,
    "",
    `  Token (ENS):    ${TOKEN_ADDRESS}`,
    `  Governor:       ${GOVERNOR_ADDRESS}`,
    "",
    `  Relayer address: ${RELAYER_ADDRESS}`,
    `  Relayer key:     ${RELAYER_KEY}  (well-known anvil dev key — local use only)`,
    "",
    "To run the relayer against this fork, in another terminal set the relayer's .env to:",
    "",
    `  RPC_URL=${rpcUrl}`,
    `  CHAIN_ID=1`,
    `  DAO_NAME=ens`,
    `  GOVERNOR_ADDRESS=${GOVERNOR_ADDRESS}`,
    `  TOKEN_ADDRESS=${TOKEN_ADDRESS}`,
    `  RELAYER_PRIVATE_KEY=${RELAYER_KEY}`,
    `  MIN_VOTING_POWER=1`,
    `  REDIS_URL=<your dev redis>`,
    `  PORT=3002`,
    "",
    "Then: pnpm --filter @anticapture/relayer dev",
    "",
    "Press Ctrl+C to stop the fork.",
    "",
  ];
  console.log(lines.join("\n"));
}

async function main() {
  const args = parseCliArgs();

  const rpcUrl = await startAnvil({
    port: args.port,
    logs: true,
    forkUrl: args.forkUrl,
  });
  const { testClient } = createClients(rpcUrl);

  // Fund relayer with 10 ETH (gas budget for relayed txs).
  await testClient.setBalance({
    address: RELAYER_ADDRESS,
    value: parseEther("10"),
  });

  // Fund developer wallet.
  await testClient.setBalance({
    address: args.wallet,
    value: args.ethAmount,
  });
  await fundFromWhale(testClient, rpcUrl, args.wallet, args.ensAmount);

  // Optionally self-delegate the developer wallet BEFORE the proposal snapshot
  // so the dashboard's vote button works (voting power is checkpointed at the
  // proposal's snapshot block).
  if (args.selfDelegate) {
    await testClient.impersonateAccount({ address: args.wallet });
    await selfDelegate(testClient, rpcUrl, args.wallet);
    await testClient.stopImpersonatingAccount({ address: args.wallet });
  }

  // Set up proposer and an Active proposal.
  await fundFromWhale(
    testClient,
    rpcUrl,
    PROPOSER_ADDRESS,
    parseUnits("250000", 18),
  );
  await selfDelegate(testClient, rpcUrl, PROPOSER_ADDRESS);
  const proposalId = await createNoOpProposal(
    testClient,
    rpcUrl,
    PROPOSER_ADDRESS,
  );
  await activateProposal(testClient, proposalId);

  // Re-arm automine. After mining a large batch (votingDelay blocks), some
  // anvil builds leave automine in a drained state where dashboard txs
  // (delegate, castVote) sit in the mempool until mined manually.
  await testClient.setAutomine(true);
  await testClient.setIntervalMining({ interval: 0 });

  // Sanity-check the dev wallet's ENS balance before printing.
  const ensBalance = await testClient.readContract({
    address: TOKEN_ADDRESS,
    abi: erc20VotesAbi,
    functionName: "balanceOf",
    args: [args.wallet],
  });
  const ethBalance = await testClient.getBalance({ address: args.wallet });

  printSummary({
    rpcUrl,
    wallet: args.wallet,
    ethDisplay: formatEther(ethBalance),
    ensDisplay: formatUnits(ensBalance, 18),
    proposalId,
    selfDelegated: args.selfDelegate,
  });

  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, stopping Anvil...`);
    await stopAnvil();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  // Block forever — keep Anvil alive until a signal arrives.
  await new Promise<void>(() => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
