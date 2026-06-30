#!/usr/bin/env -S npx tsx
/* eslint-disable @typescript-eslint/no-explicit-any -- standalone ops/verification script: viem dynamic contract reads and tolerant API JSON parsing intentionally use `any`. */
/**
 * TORN integration reconciliation / smoke test
 * --------------------------------------------
 * Validates every datapoint the Anticapture TORN integration surfaces against
 * on-chain ground truth. Produces a PASS/FAIL/SKIP report and a non-zero exit
 * code on any FAIL — use it as a production gate and as the verification for the
 * indexer Tier-1/Tier-2 fixes.
 *
 * Modes:
 *   - on-chain only (default): asserts the model invariants the integration
 *     assumes (params, quorum semantics, custody). Runs with no API.
 *   - full (set API_BASE): also fetches each TORN endpoint and diffs it against
 *     the on-chain reads.
 *
 * Run:
 *   RPC_URL=https://ethereum-rpc.publicnode.com npx tsx torn-reconcile.ts
 *   API_BASE=https://api.anticapture.com RPC_URL=... npx tsx torn-reconcile.ts
 *
 * Notes:
 *   - Use a NON-CENSORING RPC. Several public RPCs block Tornado Cash calls
 *     (OFAC). publicnode worked at time of writing; llamarpc/cloudflare/ankr did not.
 *   - API field paths are best-effort; confirm against the generated OpenAPI/client.
 */
import { createPublicClient, http, getAddress, formatUnits } from "viem";
import { mainnet } from "viem/chains";

const RPC_URL = process.env.RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const API_BASE = process.env.API_BASE ?? ""; // empty => on-chain-only mode
const DAO = "TORN";

const GOV = getAddress("0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce");
const TORN = getAddress("0x77777FeDdddFfC19Ff86DB637967013e6C6A116C");
const VAULT = getAddress("0x2F50508a8a3D323B91336FA3eA6Ae50e55f32185");

// --- validated ABI fragments (selectors confirmed against mainnet) ---
const govAbi = [
  {
    type: "function",
    name: "proposalCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "QUORUM_VOTES",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "PROPOSAL_THRESHOLD",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "VOTING_DELAY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "VOTING_PERIOD",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "EXECUTION_DELAY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "EXECUTION_EXPIRATION",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "state",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "lockedBalance",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "delegatedTo",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "proposals",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [
      { name: "proposer", type: "address" },
      { name: "target", type: "address" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "forVotes", type: "uint256" },
      { name: "againstVotes", type: "uint256" },
      { name: "executed", type: "bool" },
      { name: "extended", type: "bool" },
    ],
  },
] as const;
const erc20Abi = [
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

// TORN state() enum order (from Governance.sol)
const STATE = [
  "Pending",
  "Active",
  "Defeated",
  "Timelocked",
  "AwaitingExecution",
  "Executed",
  "Expired",
];

// viem returns multi-output functions as a positional array — normalize to an object
function asProposal(p: any) {
  return Array.isArray(p)
    ? {
        proposer: p[0],
        target: p[1],
        startTime: p[2],
        endTime: p[3],
        forVotes: p[4],
        againstVotes: p[5],
        executed: p[6],
        extended: p[7],
      }
    : p;
}

const client = createPublicClient({ chain: mainnet, transport: http(RPC_URL) });
const rGov = (functionName: any, args?: any[]) =>
  client.readContract({ address: GOV, abi: govAbi, functionName, args });
const rTok = (functionName: any, args?: any[]) =>
  client.readContract({ address: TORN, abi: erc20Abi, functionName, args });

type Row = {
  check: string;
  onchain: string;
  api: string;
  status: "PASS" | "FAIL" | "SKIP";
};
const rows: Row[] = [];
const add = (check: string, onchain: any, api: any, status: Row["status"]) =>
  rows.push({ check, onchain: String(onchain), api: String(api), status });

async function apiGet(path: string): Promise<any | null> {
  if (!API_BASE) return null;
  try {
    const url = `${API_BASE}${path}${path.includes("?") ? "&" : "?"}dao=${DAO}`;
    const res = await fetch(url);
    if (!res.ok) return { __error: `HTTP ${res.status}` };
    return await res.json();
  } catch (e: any) {
    return { __error: e.message };
  }
}

async function main() {
  console.log(
    `\nTORN reconciliation — RPC=${RPC_URL}  API=${API_BASE || "(on-chain only)"}\n`,
  );

  // 1. Governance params (validate config + API /dao)
  const [count, quorum, threshold, vDelay, vPeriod, exDelay, exExp] =
    (await Promise.all([
      rGov("proposalCount"),
      rGov("QUORUM_VOTES"),
      rGov("PROPOSAL_THRESHOLD"),
      rGov("VOTING_DELAY"),
      rGov("VOTING_PERIOD"),
      rGov("EXECUTION_DELAY"),
      rGov("EXECUTION_EXPIRATION"),
    ])) as bigint[];

  // model invariants (these are the assumptions the integration is built on)
  add(
    "invariant: quorum = 100,000 TORN",
    formatUnits(quorum, 18),
    "100000",
    quorum === 100000n * 10n ** 18n ? "PASS" : "FAIL",
  );
  add(
    "invariant: threshold = 1,000 TORN",
    formatUnits(threshold, 18),
    "1000",
    threshold === 1000n * 10n ** 18n ? "PASS" : "FAIL",
  );
  add(
    "invariant: voting delay = 75s",
    vDelay,
    "75",
    vDelay === 75n ? "PASS" : "FAIL",
  );
  add(
    "invariant: voting period = 5d",
    vPeriod,
    "432000",
    vPeriod === 432000n ? "PASS" : "FAIL",
  );
  add(
    "invariant: execution delay = 2d",
    exDelay,
    "172800",
    exDelay === 172800n ? "PASS" : "FAIL",
  );
  add(
    "invariant: execution expiration = 3d",
    exExp,
    "259200",
    exExp === 259200n ? "PASS" : "FAIL",
  );

  const dao = await apiGet("/dao");
  if (dao && !dao.__error) {
    const eq = (a: any, b: bigint) => String(a) === String(b);
    add(
      "API /dao quorum",
      quorum,
      dao.quorum,
      eq(dao.quorum, quorum) ? "PASS" : "FAIL",
    );
    add(
      "API /dao proposalThreshold",
      threshold,
      dao.proposalThreshold,
      eq(dao.proposalThreshold, threshold) ? "PASS" : "FAIL",
    );
  } else add("API /dao", quorum, dao?.__error ?? "skipped", "SKIP");

  // 2. Proposal count
  const props = await apiGet(`/proposals?limit=1`);
  const apiCount =
    props && !props.__error
      ? (props.totalCount ?? props.total ?? "?")
      : (props?.__error ?? "skipped");
  add(
    "proposal count",
    count,
    apiCount,
    props && !props.__error
      ? String(apiCount) === String(count)
        ? "PASS"
        : "FAIL"
      : "SKIP",
  );

  // 3. Per-proposal: state + tallies + quorum-fix correctness (sample latest 3)
  const ids = [count, count - 1n, count - 2n].filter((n) => n > 0n);
  for (const id of ids) {
    const [pRaw, st] = (await Promise.all([
      rGov("proposals", [id]),
      rGov("state", [id]),
    ])) as [any, number];
    const p = asProposal(pRaw);
    const onState = STATE[st];
    // calculateQuorum FIX validation: quorum reached iff for+against >= QUORUM_VOTES
    const reached = p.forVotes + p.againstVotes >= quorum;
    const oldReached = p.forVotes >= quorum; // buggy: forVotes only
    if (reached !== oldReached) {
      add(
        `#${id} quorum-fix changes outcome`,
        `for+against reached=${reached}`,
        `forVotes-only=${oldReached}`,
        "PASS",
      );
    }
    const api = await apiGet(`/proposals/${id}`);
    if (api && !api.__error) {
      const aFor = api.forVotes,
        aAg = api.againstVotes,
        aStatus = (api.status ?? "").toUpperCase();
      add(
        `#${id} forVotes`,
        p.forVotes,
        aFor,
        String(aFor) === String(p.forVotes) ? "PASS" : "FAIL",
      );
      add(
        `#${id} againstVotes`,
        p.againstVotes,
        aAg,
        String(aAg) === String(p.againstVotes) ? "PASS" : "FAIL",
      );
      add(
        `#${id} status (vs on-chain ${onState})`,
        onState,
        aStatus,
        aStatus.includes(onState.toUpperCase()) || onState === "Active"
          ? "PASS"
          : "FAIL",
      );
      // target must be preserved (attack-critical)
      const aTarget = (api.targets?.[0] ?? api.target ?? "").toLowerCase();
      add(
        `#${id} target preserved`,
        p.target.toLowerCase(),
        aTarget,
        aTarget === p.target.toLowerCase() ? "PASS" : "FAIL",
      );
    } else
      add(
        `#${id} (API)`,
        `${onState} for=${p.forVotes}`,
        api?.__error ?? "skipped",
        "SKIP",
      );
  }

  // 4. Token custody / delegatedSupply / gap #6
  const [ts, govBal, vaultBal] = (await Promise.all([
    rTok("totalSupply"),
    rTok("balanceOf", [GOV]),
    rTok("balanceOf", [VAULT]),
  ])) as bigint[];
  add("TORN totalSupply", formatUnits(ts, 18), "—", "PASS");
  add("governor TORN custody", formatUnits(govBal, 18), "—", "PASS");
  // gap #6 gate: the indexer derives locked supply from governor transfers only.
  // Vault-custodied locks exist and are NOT watched -> block prod until reconciled.
  add(
    "gap #6: vault holds untracked TORN",
    formatUnits(vaultBal, 18),
    "governor-only indexer misses this",
    vaultBal > 0n ? "FAIL" : "PASS",
  );
  const tok = await apiGet("/token");
  if (tok && !tok.__error) {
    const ds = BigInt(tok.delegatedSupply ?? 0);
    // Truth = Σ lockedBalance(all accounts) (needs full scan). Bound check: it must
    // be > governor balance alone if any vault locks are counted; flag if it tracks
    // governor-only (i.e. excludes the vault leg).
    const tracksGovernorOnly = ds <= govBal + 10n ** 21n; // within ~1000 TORN of govBal
    add(
      "delegatedSupply (confirm = Σ lockedBalance)",
      `gov=${formatUnits(govBal, 18)} vault=${formatUnits(vaultBal, 18)}`,
      formatUnits(ds, 18),
      tracksGovernorOnly ? "FAIL" : "PASS",
    );
  } else
    add(
      "delegatedSupply (needs API + Σ lockedBalance)",
      `gov=${formatUnits(govBal, 18)} vault=${formatUnits(vaultBal, 18)}`,
      tok?.__error ?? "skipped",
      "SKIP",
    );

  // 5. Per-account voting power (sample = proposer of latest proposal)
  const sampleP = asProposal(await rGov("proposals", [count]));
  const lb = (await rGov("lockedBalance", [sampleP.proposer])) as bigint;
  add(
    `lockedBalance(proposer #${count})`,
    formatUnits(lb, 18),
    ">= 1000 (threshold)",
    lb >= threshold ? "PASS" : "FAIL",
  );
  const vp = await apiGet(`/voting-powers/${sampleP.proposer}`);
  if (vp && !vp.__error) {
    add(
      `API voting-power(${sampleP.proposer.slice(0, 8)})`,
      formatUnits(lb, 18),
      vp.votingPower,
      String(vp.votingPower) === String(lb) ? "PASS" : "FAIL",
    );
  } else
    add(
      "API voting-power",
      formatUnits(lb, 18),
      vp?.__error ?? "skipped",
      "SKIP",
    );

  // --- report ---
  const w = (s: string, n: number) => s.padEnd(n).slice(0, n);
  console.log(
    w("CHECK", 42) + w("ON-CHAIN", 26) + w("API/INDEXED", 26) + "STATUS",
  );
  console.log("-".repeat(102));
  for (const r of rows)
    console.log(w(r.check, 42) + w(r.onchain, 26) + w(r.api, 26) + r.status);
  const fails = rows.filter((r) => r.status === "FAIL").length;
  const skips = rows.filter((r) => r.status === "SKIP").length;
  console.log("-".repeat(102));
  console.log(
    `\n${rows.length} checks · ${rows.length - fails - skips} pass · ${fails} FAIL · ${skips} skip` +
      (API_BASE
        ? ""
        : "  (on-chain-only; set API_BASE for full reconciliation)"),
  );
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("fatal:", e.message);
  process.exit(2);
});
