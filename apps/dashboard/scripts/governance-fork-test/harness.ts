import {
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  parseEventLogs,
  stringToBytes,
  toHex,
  type Address,
  type Hex,
  type JsonRpcAccount,
  type WriteContractParameters,
} from "viem";
import { mainnet } from "viem/chains";

import {
  getProposalCreatedEventAbi,
  submitProposalRequest,
} from "@/features/create-proposal/utils/submitProposalRequest";
import { encodeDescription } from "@/features/create-proposal/utils/encodeDescription";
import {
  executeProposal,
  queueProposal,
} from "@/features/governance/utils/submitGovernanceAction";
import { voteOnProposal } from "@/features/governance/utils/voteOnProposal";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

import {
  advanceTime,
  extendedWalletClient,
  fundAccount,
  mineBlocks,
  type ForkHandle,
} from "./fork";

/* ------------------------------------------------------------------ */
/* Per-DAO harness configuration                                       */
/* ------------------------------------------------------------------ */

/**
 * How the governor exposes reads. The write path is always the dashboard's own
 * code (submitProposalRequest / voteOnProposal / queueProposal / executeProposal),
 * so a wrong flavor here only breaks the harness's assertions, not the test
 * subject.
 */
interface DaoHarnessConfig {
  /** Where vote tallies live. */
  tally: "proposalVotes" | "bravoProposals" | "tornProposals";
  /** quorumVotes() (Bravo), quorum(snapshot) (OZ) or QUORUM_VOTES() (Tornado). */
  quorum: "quorumVotes" | "quorumAt" | "tornQuorum";
  /** Voting power source used to pick proposer/voters on the fork. */
  power: "tokenVotes" | "lockedBalance";
  /** Governor timing unit for voting delay/period. */
  clock: "blocks" | "seconds";
  /** Whether the dashboard's create-proposal path covers this DAO. */
  proposeViaDashboard: boolean;
  supportsAbstain: boolean;
  /** Tornado has no queue step and executes via delegatecall proposal contracts. */
  queueAndExecute: boolean;
  /**
   * Voting delays/periods span days (tens of thousands of blocks), far too
   * slow to mine. `slotPair` rewrites the governor's votingDelay/votingPeriod
   * storage before proposing; `proposalWindow` rewrites the created proposal's
   * vote window in the governor's `_proposals` mapping. Both are verified
   * against the governor's own getters and fall back to real mining when they
   * don't hold. `none` keeps real timing (Tornado is timestamp-based and
   * cheap to advance). Set GOV_REAL_TIMING=1 to disable all patching.
   */
  timing: { delaySlot: bigint; periodSlot: bigint } | "proposalWindow" | "none";
}

export const HARNESS_DAOS: Partial<Record<DaoIdEnum, DaoHarnessConfig>> = {
  [DaoIdEnum.UNISWAP]: {
    tally: "bravoProposals",
    quorum: "quorumVotes",
    power: "tokenVotes",
    clock: "blocks",
    proposeViaDashboard: true,
    supportsAbstain: true,
    queueAndExecute: true,
    timing: { delaySlot: 3n, periodSlot: 4n },
  },
  [DaoIdEnum.COMP]: {
    tally: "proposalVotes",
    quorum: "quorumAt",
    power: "tokenVotes",
    clock: "blocks",
    proposeViaDashboard: true,
    supportsAbstain: true,
    queueAndExecute: true,
    timing: "proposalWindow",
  },
  [DaoIdEnum.GITCOIN]: {
    // "GTC Governor Bravo" is an OZ governor with hash proposal ids and
    // GovernorCountingSimple tallies, despite the Bravo name.
    tally: "proposalVotes",
    quorum: "quorumAt",
    power: "tokenVotes",
    clock: "blocks",
    proposeViaDashboard: true,
    supportsAbstain: true,
    queueAndExecute: true,
    timing: { delaySlot: 9n, periodSlot: 10n },
  },
  [DaoIdEnum.TORN]: {
    tally: "tornProposals",
    quorum: "tornQuorum",
    power: "lockedBalance",
    clock: "seconds",
    proposeViaDashboard: true,
    supportsAbstain: false,
    queueAndExecute: false,
    timing: "none",
  },
  [DaoIdEnum.ENS]: {
    tally: "proposalVotes",
    quorum: "quorumAt",
    power: "tokenVotes",
    clock: "blocks",
    proposeViaDashboard: true,
    supportsAbstain: true,
    queueAndExecute: true,
    timing: "proposalWindow",
  },
};

/* ------------------------------------------------------------------ */
/* Read-side ABIs (assertions only; writes go through dashboard code)  */
/* ------------------------------------------------------------------ */

const stateAbi = [
  {
    type: "function",
    name: "state",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

const proposalThresholdAbi = [
  {
    type: "function",
    name: "proposalThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const quorumVotesAbi = [
  {
    type: "function",
    name: "quorumVotes",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const quorumAtAbi = [
  {
    type: "function",
    name: "quorum",
    stateMutability: "view",
    inputs: [{ name: "timepoint", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const proposalVotesAbi = [
  {
    type: "function",
    name: "proposalVotes",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "againstVotes", type: "uint256" },
      { name: "forVotes", type: "uint256" },
      { name: "abstainVotes", type: "uint256" },
    ],
  },
] as const;

const bravoProposalsAbi = [
  {
    type: "function",
    name: "proposals",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "proposer", type: "address" },
      { name: "eta", type: "uint256" },
      { name: "startBlock", type: "uint256" },
      { name: "endBlock", type: "uint256" },
      { name: "forVotes", type: "uint256" },
      { name: "againstVotes", type: "uint256" },
      { name: "abstainVotes", type: "uint256" },
      { name: "canceled", type: "bool" },
      { name: "executed", type: "bool" },
    ],
  },
] as const;

const tokenVotesAbi = [
  {
    type: "function",
    name: "getVotes",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getCurrentVotes",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint96" }],
  },
] as const;

const erc20TransferAbi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const timelockDelayAbi = [
  {
    type: "function",
    name: "delay",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getMinDelay",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const votingSettingsAbi = [
  {
    type: "function",
    name: "votingDelay",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "votingPeriod",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const proposalWindowAbi = [
  {
    type: "function",
    name: "proposalSnapshot",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "proposalDeadline",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/* Tornado Cash governance (custom, timestamp-based). */
const tornGovernanceAbi = [
  {
    type: "function",
    name: "propose",
    stateMutability: "nonpayable",
    inputs: [
      { name: "target", type: "address" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "proposalCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "PROPOSAL_THRESHOLD",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "QUORUM_VOTES",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "VOTING_DELAY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "EXECUTION_DELAY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "lockedBalance",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "proposals",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
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

/* OZ / Bravo shared proposal state enum. */
const GOV_STATE = {
  Pending: 0,
  Active: 1,
  Canceled: 2,
  Defeated: 3,
  Succeeded: 4,
  Queued: 5,
  Expired: 6,
  Executed: 7,
} as const;

/* Tornado governance state enum (different layout). */
const TORN_STATE = {
  Pending: 0,
  Active: 1,
  Defeated: 2,
  Timelocked: 3,
  AwaitingExecution: 4,
  Executed: 5,
  Expired: 6,
} as const;

/* A throwaway recipient for the 0-token test transfer the proposal executes. */
const TEST_RECIPIENT: Address = "0x000000000000000000000000000000000000bEEF";

/* Tornado proposals delegatecall their target on execution, so the target must
 * be a contract; Multicall3 is a harmless stand-in for create+vote testing. */
const MULTICALL3: Address = "0xcA11bde05977b3631167028862bE2a173976CA11";

/* Synthetic Tornado proposal contract: gets a single STOP opcode via setCode
 * so the governance delegatecall on execute() succeeds. */
const TORN_EXEC_TARGET: Address = "0x00000000000000000000000000000000000070ad";

/* ------------------------------------------------------------------ */
/* Step reporting                                                      */
/* ------------------------------------------------------------------ */

export interface StepResult {
  name: string;
  ok: boolean;
  detail: string;
}

export interface DaoRunResult {
  daoId: DaoIdEnum;
  steps: StepResult[];
  passed: boolean;
}

class StepFailure extends Error {}

const account = (address: Address): JsonRpcAccount => ({
  address,
  type: "json-rpc",
});

/* ------------------------------------------------------------------ */
/* Delegate discovery                                                  */
/* ------------------------------------------------------------------ */

interface Delegate {
  address: Address;
  votes: bigint;
}

const fetchTopDelegates = async (daoId: DaoIdEnum): Promise<Address[]> => {
  // Gateful's DAO proxy rejects the empty path segment a trailing slash
  // would produce, so strip it from custom gateway URLs.
  const apiUrl = (
    process.env.ANTICAPTURE_API_URL ?? "https://dev-gateful.up.railway.app"
  ).replace(/\/+$/, "");
  const token = process.env.BLOCKFUL_API_TOKEN;
  const url = `${apiUrl}/${daoId.toLowerCase()}/voting-powers?limit=50&orderBy=votingPower&orderDirection=desc`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new StepFailure(
      `voting-powers request failed (${res.status}) for ${url}. ` +
        "Check ANTICAPTURE_API_URL / BLOCKFUL_API_TOKEN in apps/dashboard/.env.",
    );
  }
  const body = (await res.json()) as {
    items?: { accountId: string; votingPower: string }[];
  };
  const items = body.items ?? [];
  if (items.length === 0) {
    throw new StepFailure(`the API returned no delegates for ${daoId}`);
  }
  return items.map((item) => item.accountId as Address);
};

/* ------------------------------------------------------------------ */
/* Chain readers                                                       */
/* ------------------------------------------------------------------ */

const readPower = async (
  fork: ForkHandle,
  config: DaoHarnessConfig,
  tokenAddress: Address,
  governorAddress: Address,
  delegate: Address,
): Promise<bigint> => {
  if (config.power === "lockedBalance") {
    return fork.publicClient.readContract({
      abi: tornGovernanceAbi,
      address: governorAddress,
      functionName: "lockedBalance",
      args: [delegate],
    });
  }
  try {
    return await fork.publicClient.readContract({
      abi: tokenVotesAbi,
      address: tokenAddress,
      functionName: "getVotes",
      args: [delegate],
    });
  } catch {
    return fork.publicClient.readContract({
      abi: tokenVotesAbi,
      address: tokenAddress,
      functionName: "getCurrentVotes",
      args: [delegate],
    });
  }
};

const readState = (fork: ForkHandle, governor: Address, proposalId: bigint) =>
  fork.publicClient.readContract({
    abi: stateAbi,
    address: governor,
    functionName: "state",
    args: [proposalId],
  });

interface Tally {
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
}

const readTally = async (
  fork: ForkHandle,
  config: DaoHarnessConfig,
  governor: Address,
  proposalId: bigint,
): Promise<Tally> => {
  if (config.tally === "proposalVotes") {
    const [againstVotes, forVotes, abstainVotes] =
      await fork.publicClient.readContract({
        abi: proposalVotesAbi,
        address: governor,
        functionName: "proposalVotes",
        args: [proposalId],
      });
    return { forVotes, againstVotes, abstainVotes };
  }
  if (config.tally === "bravoProposals") {
    const proposal = await fork.publicClient.readContract({
      abi: bravoProposalsAbi,
      address: governor,
      functionName: "proposals",
      args: [proposalId],
    });
    return {
      forVotes: proposal[5],
      againstVotes: proposal[6],
      abstainVotes: proposal[7],
    };
  }
  const proposal = await fork.publicClient.readContract({
    abi: tornGovernanceAbi,
    address: governor,
    functionName: "proposals",
    args: [proposalId],
  });
  return { forVotes: proposal[4], againstVotes: proposal[5], abstainVotes: 0n };
};

const readQuorum = async (
  fork: ForkHandle,
  config: DaoHarnessConfig,
  governor: Address,
  snapshot: bigint,
): Promise<bigint> => {
  if (config.quorum === "quorumVotes") {
    return fork.publicClient.readContract({
      abi: quorumVotesAbi,
      address: governor,
      functionName: "quorumVotes",
    });
  }
  if (config.quorum === "quorumAt") {
    return fork.publicClient.readContract({
      abi: quorumAtAbi,
      address: governor,
      functionName: "quorum",
      args: [snapshot],
    });
  }
  return fork.publicClient.readContract({
    abi: tornGovernanceAbi,
    address: governor,
    functionName: "QUORUM_VOTES",
  });
};

const readTimelockDelay = async (
  fork: ForkHandle,
  timelock: Address,
): Promise<bigint> => {
  try {
    return await fork.publicClient.readContract({
      abi: timelockDelayAbi,
      address: timelock,
      functionName: "delay",
    });
  } catch {
    return fork.publicClient.readContract({
      abi: timelockDelayAbi,
      address: timelock,
      functionName: "getMinDelay",
    });
  }
};

/* ------------------------------------------------------------------ */
/* Fast timing: shrink day-long voting windows on the throwaway fork   */
/* ------------------------------------------------------------------ */

/** Small vote window used when timing is patched: fast, still multi-block. */
const FAST_DELAY = 5n;
const FAST_PERIOD = 60n;

const readStorageSlot = async (
  fork: ForkHandle,
  address: Address,
  slot: Hex,
): Promise<bigint> => {
  const raw = await fork.publicClient.getStorageAt({ address, slot });
  return raw ? BigInt(raw) : 0n;
};

const writeStorageSlot = (
  fork: ForkHandle,
  address: Address,
  slot: Hex,
  value: bigint,
) =>
  fork.testClient.setStorageAt({
    address,
    index: slot,
    value: toHex(value, { size: 32 }),
  });

/**
 * Rewrites the governor's votingDelay/votingPeriod storage (Bravo-style
 * governors keep them in plain slots) so the proposal created next gets a
 * small vote window. Verified against the governor's own getters; restored
 * and reported when the slots don't hold the expected values.
 */
const patchTimingSlots = async (
  fork: ForkHandle,
  governor: Address,
  slots: { delaySlot: bigint; periodSlot: bigint },
): Promise<boolean> => {
  const readSettings = () =>
    Promise.all([
      fork.publicClient.readContract({
        abi: votingSettingsAbi,
        address: governor,
        functionName: "votingDelay",
      }),
      fork.publicClient.readContract({
        abi: votingSettingsAbi,
        address: governor,
        functionName: "votingPeriod",
      }),
    ]);

  const [delay, period] = await readSettings();
  const delaySlot = toHex(slots.delaySlot, { size: 32 });
  const periodSlot = toHex(slots.periodSlot, { size: 32 });
  const [storedDelay, storedPeriod] = await Promise.all([
    readStorageSlot(fork, governor, delaySlot),
    readStorageSlot(fork, governor, periodSlot),
  ]);
  if (storedDelay !== delay || storedPeriod !== period) return false;

  await writeStorageSlot(fork, governor, delaySlot, FAST_DELAY);
  await writeStorageSlot(fork, governor, periodSlot, FAST_PERIOD);

  const [newDelay, newPeriod] = await readSettings();
  if (newDelay !== FAST_DELAY || newPeriod !== FAST_PERIOD) {
    await writeStorageSlot(fork, governor, delaySlot, delay);
    await writeStorageSlot(fork, governor, periodSlot, period);
    return false;
  }
  return true;
};

const mappingSlot = (proposalId: bigint, base: bigint): Hex =>
  keccak256(
    encodeAbiParameters(
      [{ type: "uint256" }, { type: "uint256" }],
      [proposalId, base],
    ),
  );

/** ERC-7201 namespaced storage root: keccak(keccak(ns) - 1) & ~0xff. */
const erc7201Root = (namespace: string): bigint =>
  BigInt(
    keccak256(
      encodeAbiParameters(
        [{ type: "uint256" }],
        [BigInt(keccak256(stringToBytes(namespace))) - 1n],
      ),
    ),
  ) & ~0xffn;

/**
 * Candidate base slots for the governor's `_proposals` mapping: plain slots
 * (pre-ERC-7201 OZ versions) plus the namespaced Governor storage roots that
 * OZ v5 builds (e.g. the Compound Governor) use.
 */
const proposalMappingBases = (): bigint[] => {
  const bases: bigint[] = [];
  for (let base = 0n; base <= 64n; base += 1n) bases.push(base);
  const root = erc7201Root("openzeppelin.storage.Governor");
  for (let offset = 0n; offset <= 8n; offset += 1n) bases.push(root + offset);
  return bases;
};

const slotPlusOne = (slot: Hex): Hex => toHex(BigInt(slot) + 1n, { size: 32 });

/**
 * Rewrites an already-created proposal's vote window inside the OZ governor's
 * `_proposals` mapping. Handles both storage shapes in the wild: OZ v5 packs
 * proposer/voteStart(uint48)/voteDuration(uint32) in one slot; OZ v4 keeps
 * voteStart and voteEnd as consecutive uint64 timer slots. The mapping's base
 * slot is discovered by matching the known proposer/snapshot/deadline, and the
 * result is verified through proposalSnapshot()/proposalDeadline().
 */
const patchProposalWindow = async (
  fork: ForkHandle,
  governor: Address,
  proposal: {
    proposalId: bigint;
    proposer: Address;
    snapshot: bigint;
    deadline: bigint;
  },
): Promise<boolean> => {
  const mask64 = (1n << 64n) - 1n;
  const mask160 = (1n << 160n) - 1n;
  const current = await fork.publicClient.getBlockNumber();
  const newStart = current + FAST_DELAY;
  const newEnd = newStart + FAST_PERIOD;

  const verify = async () => {
    const [snapshot, deadline] = await Promise.all([
      fork.publicClient.readContract({
        abi: proposalWindowAbi,
        address: governor,
        functionName: "proposalSnapshot",
        args: [proposal.proposalId],
      }),
      fork.publicClient.readContract({
        abi: proposalWindowAbi,
        address: governor,
        functionName: "proposalDeadline",
        args: [proposal.proposalId],
      }),
    ]);
    return snapshot === newStart && deadline === newEnd;
  };

  for (const base of proposalMappingBases()) {
    const slot = mappingSlot(proposal.proposalId, base);
    const value = await readStorageSlot(fork, governor, slot);
    if (value === 0n) continue;

    // OZ v5 ProposalCore: proposer | voteStart(uint48) << 160 | voteDuration(uint32) << 208
    if ((value & mask160) === BigInt(proposal.proposer)) {
      const upper = value >> 240n;
      const patched =
        (upper << 240n) |
        (FAST_PERIOD << 208n) |
        (newStart << 160n) |
        BigInt(proposal.proposer);
      await writeStorageSlot(fork, governor, slot, patched);
      if (await verify()) return true;
      await writeStorageSlot(fork, governor, slot, value);
      continue;
    }

    // OZ v4 ProposalCore: two consecutive uint64 timer slots (voteStart, voteEnd)
    if ((value & mask64) === proposal.snapshot && value >> 64n === 0n) {
      const endSlot = slotPlusOne(slot);
      const endValue = await readStorageSlot(fork, governor, endSlot);
      if ((endValue & mask64) !== proposal.deadline) continue;
      await writeStorageSlot(fork, governor, slot, newStart);
      await writeStorageSlot(
        fork,
        governor,
        endSlot,
        (endValue & ~mask64) | newEnd,
      );
      if (await verify()) return true;
      await writeStorageSlot(fork, governor, slot, value);
      await writeStorageSlot(fork, governor, endSlot, endValue);
    }
  }
  return false;
};

/**
 * GovernorPreventLateQuorum pushes the proposal deadline forward when quorum
 * arrives close to it; with a shortened vote window every vote counts as
 * "late", so the extension must be cleared for the proposal to leave Active.
 * Finds the extended-deadline slot by value and zeroes it, verified through
 * proposalDeadline() returning to the core deadline.
 */
const clearDeadlineExtension = async (
  fork: ForkHandle,
  governor: Address,
  proposal: { proposalId: bigint; deadline: bigint },
  extendedDeadline: bigint,
): Promise<boolean> => {
  const mask64 = (1n << 64n) - 1n;
  const bases = proposalMappingBases();
  const lateQuorumRoot = erc7201Root(
    "openzeppelin.storage.GovernorPreventLateQuorum",
  );
  for (let offset = 0n; offset <= 4n; offset += 1n) {
    bases.push(lateQuorumRoot + offset);
  }

  for (const base of bases) {
    const slot = mappingSlot(proposal.proposalId, base);
    const value = await readStorageSlot(fork, governor, slot);
    if (value === 0n || (value & mask64) !== extendedDeadline) continue;

    await writeStorageSlot(fork, governor, slot, value & ~mask64);
    const deadline = await fork.publicClient.readContract({
      abi: proposalWindowAbi,
      address: governor,
      functionName: "proposalDeadline",
      args: [proposal.proposalId],
    });
    if (deadline === proposal.deadline) return true;
    await writeStorageSlot(fork, governor, slot, value);
  }
  return false;
};

/* ------------------------------------------------------------------ */
/* Proposal submission through the dashboard's own code                */
/* ------------------------------------------------------------------ */

type DashboardWriteContract = Parameters<typeof submitProposalRequest>[0];

/**
 * Bridges the wagmi `writeContract` mutate function that the dashboard's
 * `submitProposalRequest` expects onto a plain viem wallet client pointed at
 * the fork, capturing the resulting tx hash promise.
 */
const captureWriteContract = (fork: ForkHandle, from: Address) => {
  const hashes: Promise<Hex>[] = [];
  const client = extendedWalletClient(fork);
  const writeContract: DashboardWriteContract = (variables) => {
    const request = {
      address: variables.address,
      abi: variables.abi,
      functionName: variables.functionName,
      args: variables.args,
      value: "value" in variables ? variables.value : undefined,
      account: account(from),
      chain: mainnet,
    } as WriteContractParameters;
    hashes.push(client.writeContract(request));
  };
  return { writeContract, hashes };
};

interface ProposalContext {
  proposalId: bigint;
  proposer: Address;
  snapshot: bigint;
  deadline: bigint;
  description: string;
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
}

const proposeViaDashboard = async (
  fork: ForkHandle,
  daoId: DaoIdEnum,
  config: DaoHarnessConfig,
  governor: Address,
  tokenAddress: Address,
  proposer: Address,
): Promise<ProposalContext> => {
  const title = `Anticapture fork test for ${daoId} at ${Date.now()}`;
  const body =
    "Automated governance lifecycle test: transfers 0 tokens to a throwaway address.";
  const discussionUrl = "";
  const description = encodeDescription(title, discussionUrl, body);

  const isTornado = config.tally === "tornProposals";
  if (isTornado) {
    // Tornado executes proposals by delegatecalling the target, so give the
    // synthetic proposal contract a single STOP so execution succeeds.
    await fork.testClient.setCode({
      address: TORN_EXEC_TARGET,
      bytecode: "0x00",
    });
  }

  const targets: Address[] = [isTornado ? TORN_EXEC_TARGET : tokenAddress];
  const values = [0n];
  const calldatas: Hex[] = [
    isTornado
      ? // executeProposal() selector: the only action the TORN propose path
        // accepts, mirroring what governance delegatecalls on execution.
        "0x373058b8"
      : encodeFunctionData({
          abi: erc20TransferAbi,
          functionName: "transfer",
          args: [TEST_RECIPIENT, 0n],
        }),
  ];

  const { writeContract, hashes } = captureWriteContract(fork, proposer);
  submitProposalRequest(writeContract, {
    daoId,
    governorAddress: governor,
    votingStrategyAddress:
      daoConfigByDaoId[daoId].daoOverview.contracts.votingStrategy,
    encoded: { targets, values, calldatas },
    title,
    body,
    discussionUrl,
    chainId: mainnet.id,
  });

  if (hashes.length !== 1) {
    throw new StepFailure(
      `submitProposalRequest issued ${hashes.length} transactions, expected 1`,
    );
  }
  const hash = await hashes[0];
  const receipt = await fork.publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new StepFailure(`propose transaction reverted (tx ${hash})`);
  }

  const events = parseEventLogs({
    abi: getProposalCreatedEventAbi(daoId),
    logs: receipt.logs,
    eventName: "ProposalCreated",
  });
  const created = events[0];
  if (!created || !("proposalId" in created.args)) {
    throw new StepFailure("no ProposalCreated event found in the receipt");
  }
  const proposalId = created.args.proposalId;

  // Tornado's event carries startTime/endTime; read the window from the
  // governor instead so the lifecycle stays timepoint-based.
  const window =
    "startBlock" in created.args
      ? { snapshot: created.args.startBlock, deadline: created.args.endBlock }
      : await fork.publicClient
          .readContract({
            abi: tornGovernanceAbi,
            address: governor,
            functionName: "proposals",
            args: [proposalId],
          })
          .then((proposal) => ({
            snapshot: proposal[2],
            deadline: proposal[3],
          }));

  return {
    proposalId,
    proposer,
    snapshot: window.snapshot,
    deadline: window.deadline,
    description,
    targets,
    values,
    calldatas,
  };
};

const proposeTornado = async (
  fork: ForkHandle,
  governor: Address,
  proposer: Address,
): Promise<ProposalContext> => {
  const description = JSON.stringify({
    title: `Anticapture fork test at ${Date.now()}`,
    description: "Automated governance lifecycle test (no-op target).",
  });
  const client = extendedWalletClient(fork);
  const hash = await client.writeContract({
    abi: tornGovernanceAbi,
    address: governor,
    functionName: "propose",
    args: [MULTICALL3, description],
    account: account(proposer),
    chain: mainnet,
  });
  const receipt = await fork.publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new StepFailure(`Tornado propose reverted (tx ${hash})`);
  }
  const proposalId = await fork.publicClient.readContract({
    abi: tornGovernanceAbi,
    address: governor,
    functionName: "proposalCount",
  });
  const proposal = await fork.publicClient.readContract({
    abi: tornGovernanceAbi,
    address: governor,
    functionName: "proposals",
    args: [proposalId],
  });
  return {
    proposalId,
    proposer,
    snapshot: proposal[2],
    deadline: proposal[3],
    description,
    targets: [MULTICALL3],
    values: [0n],
    calldatas: ["0x"],
  };
};

/* ------------------------------------------------------------------ */
/* The lifecycle                                                       */
/* ------------------------------------------------------------------ */

const formatVotes = (votes: bigint, decimals: number) => {
  const whole = votes / 10n ** BigInt(decimals);
  return whole.toLocaleString("en-US");
};

export const runDaoLifecycle = async (
  fork: ForkHandle,
  daoId: DaoIdEnum,
): Promise<DaoRunResult> => {
  const steps: StepResult[] = [];
  const config = HARNESS_DAOS[daoId];
  if (!config) {
    return {
      daoId,
      steps: [{ name: "setup", ok: false, detail: "unsupported DAO" }],
      passed: false,
    };
  }

  const daoConfig = daoConfigByDaoId[daoId];
  const governor = daoConfig.daoOverview.contracts.governor;
  const rawToken = daoConfig.daoOverview.contracts.token;
  const timelock = daoConfig.daoOverview.contracts.timelock;
  const decimals = daoConfig.decimals;

  const pass = (name: string, detail: string) => {
    steps.push({ name, ok: true, detail });
    console.log(`  PASS ${name}: ${detail}`);
  };

  try {
    if (!governor || typeof rawToken !== "string") {
      throw new StepFailure("missing governor or token address in dao-config");
    }
    const tokenAddress = rawToken;

    /* -- step: pick proposer and voters from live delegate data -------- */
    const delegateAddresses = await fetchTopDelegates(daoId);
    const delegates: Delegate[] = [];
    for (const address of delegateAddresses) {
      const votes = await readPower(
        fork,
        config,
        tokenAddress,
        governor,
        address,
      );
      if (votes > 0n) delegates.push({ address, votes });
    }
    delegates.sort((a, b) => (b.votes > a.votes ? 1 : -1));
    if (delegates.length < 3) {
      throw new StepFailure(
        `only ${delegates.length} delegates with on-fork voting power`,
      );
    }

    const threshold =
      config.power === "lockedBalance"
        ? await fork.publicClient.readContract({
            abi: tornGovernanceAbi,
            address: governor,
            functionName: "PROPOSAL_THRESHOLD",
          })
        : await fork.publicClient.readContract({
            abi: proposalThresholdAbi,
            address: governor,
            functionName: "proposalThreshold",
          });

    const proposerCandidates = delegates.filter((d) => d.votes >= threshold);
    if (proposerCandidates.length === 0) {
      throw new StepFailure(
        `no delegate reaches the proposal threshold of ${formatVotes(threshold, decimals)}`,
      );
    }
    pass(
      "delegates",
      `${delegates.length} delegates with power on the fork, ` +
        `${proposerCandidates.length} above the ${formatVotes(threshold, decimals)} threshold`,
    );

    /* -- step: shrink the vote window so days of blocks become seconds -- */
    const realTiming = process.env.GOV_REAL_TIMING === "1";
    if (!realTiming && typeof config.timing === "object") {
      if (await patchTimingSlots(fork, governor, config.timing)) {
        pass(
          "fast-timing",
          `governor votingDelay/votingPeriod patched to ${FAST_DELAY}/${FAST_PERIOD} blocks (verified via getters)`,
        );
      } else {
        console.log(
          "  note: timing slots did not match; keeping real voting windows (slow)",
        );
      }
    }

    /* -- step: create the proposal through the dashboard's path -------- */
    let context: ProposalContext | null = null;
    let lastError: unknown = null;
    for (const candidate of proposerCandidates.slice(0, 5)) {
      await fundAccount(fork, candidate.address);
      try {
        context = config.proposeViaDashboard
          ? await proposeViaDashboard(
              fork,
              daoId,
              config,
              governor,
              tokenAddress,
              candidate.address,
            )
          : await proposeTornado(fork, governor, candidate.address);
        break;
      } catch (error) {
        lastError = error;
        console.log(
          `  note: propose failed from ${candidate.address} ` +
            "(may already have a live proposal), trying the next delegate",
        );
      }
    }
    if (!context) {
      throw new StepFailure(
        `could not create a proposal from any of the top delegates: ${String(lastError)}`,
      );
    }
    const proposal = context;
    pass(
      "propose",
      `proposal ${proposal.proposalId} created by ${proposal.proposer}` +
        (config.proposeViaDashboard
          ? " via submitProposalRequest"
          : " via Tornado propose(target, description)"),
    );

    const pendingState = await readState(fork, governor, proposal.proposalId);
    if (pendingState !== GOV_STATE.Pending) {
      throw new StepFailure(`expected Pending(0), got state ${pendingState}`);
    }
    pass("state:pending", "proposal starts Pending");

    if (!realTiming && config.timing === "proposalWindow") {
      if (await patchProposalWindow(fork, governor, proposal)) {
        const [snapshot, deadline] = await Promise.all([
          fork.publicClient.readContract({
            abi: proposalWindowAbi,
            address: governor,
            functionName: "proposalSnapshot",
            args: [proposal.proposalId],
          }),
          fork.publicClient.readContract({
            abi: proposalWindowAbi,
            address: governor,
            functionName: "proposalDeadline",
            args: [proposal.proposalId],
          }),
        ]);
        proposal.snapshot = snapshot;
        proposal.deadline = deadline;
        pass(
          "fast-timing",
          `proposal vote window patched to ${FAST_DELAY}/${FAST_PERIOD} blocks (verified via getters)`,
        );
      } else {
        console.log(
          "  note: proposal storage layout not recognized; keeping the real vote window (slow)",
        );
      }
    }

    /* -- step: advance past the voting delay --------------------------- */
    if (config.clock === "blocks") {
      const current = await fork.publicClient.getBlockNumber();
      const toMine = Number(proposal.snapshot - current) + 1;
      await mineBlocks(fork, toMine);
      pass("voting-delay", `mined ${toMine} blocks to pass the snapshot`);
    } else {
      const delay = await fork.publicClient.readContract({
        abi: tornGovernanceAbi,
        address: governor,
        functionName: "VOTING_DELAY",
      });
      await advanceTime(fork, Number(delay) + 1);
      pass("voting-delay", `advanced ${delay}s to pass the voting delay`);
    }

    const activeState = await readState(fork, governor, proposal.proposalId);
    if (activeState !== GOV_STATE.Active) {
      throw new StepFailure(`expected Active(1), got state ${activeState}`);
    }
    pass("state:active", "proposal is Active");

    /* -- step: vote with impersonated delegates ------------------------ */
    const quorum = await readQuorum(fork, config, governor, proposal.snapshot);

    const smallest = [...delegates].reverse();
    const againstVoter = smallest[0];
    const abstainVoter = config.supportsAbstain ? smallest[1] : null;
    const reserved = new Set(
      [againstVoter.address, abstainVoter?.address].filter(Boolean),
    );

    const forVoters: Delegate[] = [];
    let forSum = 0n;
    for (const delegate of delegates) {
      if (reserved.has(delegate.address)) continue;
      forVoters.push(delegate);
      forSum += delegate.votes;
      if (forSum >= quorum + againstVoter.votes + 1n && forVoters.length >= 2)
        break;
    }
    if (forSum < quorum) {
      throw new StepFailure(
        `top delegates only hold ${formatVotes(forSum, decimals)} of the ` +
          `${formatVotes(quorum, decimals)} quorum`,
      );
    }

    const client = extendedWalletClient(fork);
    const castOne = async (
      voter: Delegate,
      vote: "for" | "against" | "abstain",
      comment?: string,
    ) => {
      await fundAccount(fork, voter.address);
      const receipt = await voteOnProposal(
        vote,
        proposal.proposalId.toString(),
        account(voter.address),
        mainnet,
        daoId,
        client,
        () => undefined,
        comment,
        null,
        false,
        [],
      );
      if (!receipt || receipt.status !== "success") {
        throw new StepFailure(
          `voteOnProposal(${vote}) failed for ${voter.address}`,
        );
      }
    };

    await castOne(againstVoter, "against");
    if (abstainVoter) await castOne(abstainVoter, "abstain");
    for (const [index, voter] of forVoters.entries()) {
      await castOne(
        voter,
        "for",
        index === 0 ? "Automated fork test vote" : undefined,
      );
    }
    pass(
      "vote",
      `${forVoters.length} for (${formatVotes(forSum, decimals)}), ` +
        `1 against${abstainVoter ? ", 1 abstain" : ""} via voteOnProposal`,
    );

    /* -- step: verify tallies match the impersonated voting power ------ */
    const tally = await readTally(fork, config, governor, proposal.proposalId);
    if (tally.forVotes !== forSum) {
      throw new StepFailure(
        `forVotes tally ${tally.forVotes} does not match cast power ${forSum}`,
      );
    }
    if (tally.againstVotes !== againstVoter.votes) {
      throw new StepFailure(
        `againstVotes tally ${tally.againstVotes} does not match ${againstVoter.votes}`,
      );
    }
    if (abstainVoter && tally.abstainVotes !== abstainVoter.votes) {
      throw new StepFailure(
        `abstainVotes tally ${tally.abstainVotes} does not match ${abstainVoter.votes}`,
      );
    }
    pass("tallies", "on-chain tallies match the cast voting power exactly");

    /* -- step: close the voting period ---------------------------------- */
    if (config.clock === "blocks") {
      const current = await fork.publicClient.getBlockNumber();
      await mineBlocks(fork, Number(proposal.deadline - current) + 1);
    } else {
      const now = (await fork.publicClient.getBlock()).timestamp;
      await advanceTime(fork, Number(proposal.deadline - now) + 1);
    }

    let finalState = await readState(fork, governor, proposal.proposalId);
    if (
      !realTiming &&
      finalState === GOV_STATE.Active &&
      config.tally === "proposalVotes"
    ) {
      const extendedDeadline = await fork.publicClient.readContract({
        abi: proposalWindowAbi,
        address: governor,
        functionName: "proposalDeadline",
        args: [proposal.proposalId],
      });
      if (
        extendedDeadline > proposal.deadline &&
        (await clearDeadlineExtension(
          fork,
          governor,
          proposal,
          extendedDeadline,
        ))
      ) {
        await mineBlocks(fork, 2);
        finalState = await readState(fork, governor, proposal.proposalId);
        pass(
          "late-quorum",
          "cleared the GovernorPreventLateQuorum deadline extension",
        );
      }
    }
    if (config.tally === "tornProposals") {
      if (
        finalState !== TORN_STATE.Timelocked &&
        finalState !== TORN_STATE.AwaitingExecution
      ) {
        throw new StepFailure(
          `expected Timelocked(3) or AwaitingExecution(4), got ${finalState}`,
        );
      }
      pass("state:succeeded", `proposal passed (Tornado state ${finalState})`);

      // Tornado has no queue step: the proposal is Timelocked until
      // endTime + EXECUTION_DELAY, then executable via execute(proposalId).
      const executionDelay = await fork.publicClient.readContract({
        abi: tornGovernanceAbi,
        address: governor,
        functionName: "EXECUTION_DELAY",
      });
      await advanceTime(fork, Number(executionDelay) + 60);
      const awaitingState = await readState(
        fork,
        governor,
        proposal.proposalId,
      );
      if (awaitingState !== TORN_STATE.AwaitingExecution) {
        throw new StepFailure(
          `expected AwaitingExecution(4), got state ${awaitingState}`,
        );
      }

      const executeReceipt = await executeProposal(
        proposal.targets,
        proposal.values.map((v) => v.toString()),
        proposal.calldatas,
        proposal.description,
        proposal.proposer,
        daoId,
        client,
        () => undefined,
        proposal.proposalId.toString(),
      );
      if (executeReceipt.status !== "success") {
        throw new StepFailure("Tornado execute transaction reverted");
      }
      const executedState = await readState(
        fork,
        governor,
        proposal.proposalId,
      );
      if (executedState !== TORN_STATE.Executed) {
        throw new StepFailure(
          `expected Executed(5), got state ${executedState}`,
        );
      }
      pass(
        "execute",
        `proposal Executed via executeProposal after the ${executionDelay}s execution delay`,
      );
      return { daoId, steps, passed: true };
    }
    if (finalState !== GOV_STATE.Succeeded) {
      throw new StepFailure(`expected Succeeded(4), got state ${finalState}`);
    }
    pass("state:succeeded", "proposal Succeeded after the voting period");

    /* -- step: queue and execute through the dashboard's path ----------- */
    if (config.queueAndExecute) {
      if (!timelock) throw new StepFailure("no timelock in dao-config");
      const stringValues = proposal.values.map((v) => v.toString());

      const queueReceipt = await queueProposal(
        proposal.targets,
        stringValues,
        proposal.calldatas,
        proposal.description,
        proposal.proposer,
        daoId,
        client,
        () => undefined,
        proposal.proposalId.toString(),
      );
      if (queueReceipt.status !== "success") {
        throw new StepFailure("queue transaction reverted");
      }
      const queuedState = await readState(fork, governor, proposal.proposalId);
      if (queuedState !== GOV_STATE.Queued) {
        throw new StepFailure(`expected Queued(5), got state ${queuedState}`);
      }
      pass("queue", "proposal Queued via queueProposal");

      const delay = await readTimelockDelay(fork, timelock);
      await advanceTime(fork, Number(delay) + 60);

      const executeReceipt = await executeProposal(
        proposal.targets,
        stringValues,
        proposal.calldatas,
        proposal.description,
        proposal.proposer,
        daoId,
        client,
        () => undefined,
        proposal.proposalId.toString(),
      );
      if (executeReceipt.status !== "success") {
        throw new StepFailure("execute transaction reverted");
      }
      const executedState = await readState(
        fork,
        governor,
        proposal.proposalId,
      );
      if (executedState !== GOV_STATE.Executed) {
        throw new StepFailure(
          `expected Executed(7), got state ${executedState}`,
        );
      }
      pass(
        "execute",
        `proposal Executed via executeProposal after the ${delay}s timelock`,
      );
    }

    return { daoId, steps, passed: true };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : `unexpected: ${String(error)}`;
    steps.push({ name: "FAILED", ok: false, detail });
    console.log(`  FAIL ${detail}`);
    return { daoId, steps, passed: false };
  }
};
