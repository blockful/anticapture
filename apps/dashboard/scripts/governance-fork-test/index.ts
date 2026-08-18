/**
 * Governance lifecycle fork test.
 *
 * Spawns an anvil fork of mainnet, then drives the full governance lifecycle
 * for each requested DAO through the dashboard's own transaction-layer code:
 * create a proposal (submitProposalRequest), vote for/against/abstain with
 * impersonated top delegates (voteOnProposal), and queue + execute it
 * (queueProposal / executeProposal), asserting the on-chain state transitions
 * and vote tallies at every step.
 *
 *   pnpm --filter @anticapture/dashboard test:governance uni
 *   pnpm --filter @anticapture/dashboard test:governance uni comp gtc torn ens
 *   pnpm --filter @anticapture/dashboard test:governance all
 */
import "dotenv/config";

import { toDaoIdEnum, type DaoIdEnum } from "@/shared/types/daos";

import { startFork } from "./fork";
import { HARNESS_DAOS, runDaoLifecycle, type DaoRunResult } from "./harness";

const DEFAULT_FORK_RPC = "https://ethereum-rpc.publicnode.com";

const parseDaoArgs = (args: string[]): DaoIdEnum[] => {
  const supported = Object.keys(HARNESS_DAOS) as DaoIdEnum[];
  if (args.length === 0 || args.includes("all")) return supported;

  return args.map((arg) => {
    const daoId = toDaoIdEnum(arg);
    if (!daoId || !HARNESS_DAOS[daoId]) {
      throw new Error(
        `Unsupported DAO "${arg}". Supported: ${supported.join(", ").toLowerCase()} (or "all").`,
      );
    }
    return daoId;
  });
};

const main = async () => {
  const daoIds = parseDaoArgs(process.argv.slice(2));
  const forkUrl = process.env.GOV_FORK_RPC_URL ?? DEFAULT_FORK_RPC;
  const port = Number(process.env.GOV_FORK_PORT ?? 8546);

  console.log(`Governance fork test: ${daoIds.join(", ")}`);
  const fork = await startFork({ forkUrl, port });

  const results: DaoRunResult[] = [];
  try {
    for (const daoId of daoIds) {
      console.log(`\n=== ${daoId} ===`);
      results.push(await runDaoLifecycle(fork, daoId));
    }
  } finally {
    fork.stop();
  }

  console.log("\n=== Summary ===");
  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"} ${result.daoId}`);
    if (!result.passed) {
      const failed = result.steps.find((step) => !step.ok);
      if (failed) console.log(`     ${failed.detail}`);
    }
  }

  if (results.some((result) => !result.passed)) process.exit(1);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
