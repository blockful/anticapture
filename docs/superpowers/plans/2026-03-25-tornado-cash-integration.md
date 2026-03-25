# Tornado Cash DAO Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full integration of Tornado Cash DAO (TORN) into the Anticapture platform — indexer, API, gateway, and dashboard.

**Architecture:** Tornado Cash uses a custom stake-to-vote governance (not OZ Governor). TORN tokens are locked in the Governance contract for voting power. The governor emits `Voted`, `ProposalCreated`, `ProposalExecuted`, `Delegated`, `Undelegated` events. The token emits standard `Transfer` events only (no delegation events). All intermediate proposal states (Active, Defeated, Timelocked, etc.) are computed at the API level via timestamp comparisons.

**Tech Stack:** Ponder (indexer), Hono + Drizzle (API), viem, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-25-tornado-cash-integration-design.md`

**RPC:** Merkle RPC blocks Tornado Cash (sanctioned). Use user's local reth node or Llama RPC (`eth.llamarpc.com`).

**Working directory:** `/home/nodeful/anticapture/.worktrees/tornado-cash`

---

### Task 1: Enum Sync

**Files:**

- Modify: `apps/indexer/src/lib/enums.ts`
- Modify: `apps/api/src/lib/enums.ts`
- Modify: `apps/dashboard/shared/types/daos.ts`

- [ ] **Step 1: Add TORN to indexer enum**

```typescript
// apps/indexer/src/lib/enums.ts — add to DaoIdEnum
TORN = "TORN",
```

- [ ] **Step 2: Add TORN to API enum**

```typescript
// apps/api/src/lib/enums.ts — add to DaoIdEnum
TORN = "TORN",
```

- [ ] **Step 3: Add TORN to dashboard enum**

```typescript
// apps/dashboard/shared/types/daos.ts — add to DaoIdEnum
TORN = "TORN",
```

- [ ] **Step 4: Commit**

```bash
git add apps/indexer/src/lib/enums.ts apps/api/src/lib/enums.ts apps/dashboard/shared/types/daos.ts
git commit -m "feat(torn): add TORN to DaoIdEnum across all packages"
```

---

### Task 2: Indexer Constants

**Files:**

- Modify: `apps/indexer/src/lib/constants.ts`

- [ ] **Step 1: Add CONTRACT_ADDRESSES entry**

Add after the last entry in `CONTRACT_ADDRESSES` (before `} as const`):

```typescript
[DaoIdEnum.TORN]: {
  blockTime: 12,
  // https://etherscan.io/address/0x77777FeDdddFfC19Ff86DB637967013e6C6A116C
  token: {
    address: "0x77777FeDdddFfC19Ff86DB637967013e6C6A116C",
    decimals: 18,
    startBlock: 11474599,
  },
  // https://etherscan.io/address/0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce
  governor: {
    address: "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce",
    startBlock: 11474695,
  },
},
```

- [ ] **Step 2: Add address list entries**

Add `[DaoIdEnum.TORN]: {}` to each of: `TreasuryAddresses`, `CEXAddresses`, `DEXAddresses`, `LendingAddresses`, `BurningAddresses`.

Add the governance contract to `NonCirculatingAddresses` (locked TORN is not circulating):

```typescript
[DaoIdEnum.TORN]: {
  governance: "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce",
  vault: "0x2F50508a8a3D323B91336FA3eA6ae50E55f32185",
},
```

- [ ] **Step 3: Typecheck**

```bash
cd /home/nodeful/anticapture/.worktrees/tornado-cash && pnpm indexer typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/indexer/src/lib/constants.ts
git commit -m "feat(torn): add TORN contract addresses and address lists"
```

---

### Task 3: Indexer ABIs

**Files:**

- Create: `apps/indexer/src/indexer/torn/abi/token.ts`
- Create: `apps/indexer/src/indexer/torn/abi/governor.ts`
- Create: `apps/indexer/src/indexer/torn/abi/index.ts`

- [ ] **Step 1: Create token ABI**

```typescript
// apps/indexer/src/indexer/torn/abi/token.ts
// Standard ERC20 — Transfer only (TORN has no delegation events)
export const TORNTokenAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
] as const;
```

- [ ] **Step 2: Create governor ABI**

```typescript
// apps/indexer/src/indexer/torn/abi/governor.ts
export const TORNGovernorAbi = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "proposer", type: "address" },
      { indexed: false, name: "target", type: "address" },
      { indexed: false, name: "startTime", type: "uint256" },
      { indexed: false, name: "endTime", type: "uint256" },
      { indexed: false, name: "description", type: "string" },
    ],
  },
  {
    type: "event",
    name: "Voted",
    inputs: [
      { indexed: true, name: "proposalId", type: "uint256" },
      { indexed: true, name: "voter", type: "address" },
      { indexed: true, name: "support", type: "bool" },
      { indexed: false, name: "votes", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [{ indexed: true, name: "proposalId", type: "uint256" }],
  },
  {
    type: "event",
    name: "Delegated",
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: true, name: "to", type: "address" },
    ],
  },
  {
    type: "event",
    name: "Undelegated",
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: true, name: "from", type: "address" },
    ],
  },
] as const;
```

- [ ] **Step 3: Create index re-export**

```typescript
// apps/indexer/src/indexer/torn/abi/index.ts
export { TORNTokenAbi } from "./token";
export { TORNGovernorAbi } from "./governor";
```

- [ ] **Step 4: Commit**

```bash
git add apps/indexer/src/indexer/torn/abi/
git commit -m "feat(torn): add TORN token and governor ABIs"
```

---

### Task 4: Indexer Token Handler

**Files:**

- Create: `apps/indexer/src/indexer/torn/erc20.ts`

Reference: `apps/indexer/src/indexer/ens/erc20.ts`

- [ ] **Step 1: Create token handler**

Follow the ENS pattern exactly, but:

- Contract name prefix: `TORN` (Ponder event: `TORNToken:Transfer`)
- No `DelegateChanged` or `DelegateVotesChanged` handlers (TORN doesn't emit them)
- Add lock tracking: detect transfers to/from the governance contract and call `updateDelegatedSupply()`

```typescript
// apps/indexer/src/indexer/torn/erc20.ts
import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address, getAddress } from "viem";

import { tokenTransfer } from "@/eventHandlers";
import {
  updateDelegatedSupply,
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";
import { handleTransaction } from "@/eventHandlers/shared";
import {
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  CONTRACT_ADDRESSES,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
  NonCirculatingAddresses,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

const GOVERNANCE_ADDRESS = getAddress(
  CONTRACT_ADDRESSES[DaoIdEnum.TORN].governor.address,
);

export function TORNTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.TORN;

  ponder.on("TORNToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on("TORNToken:Transfer", async ({ event, context }) => {
    const { from, to, value } = event.args;
    const { timestamp } = event.block;

    const cexAddressList = Object.values(CEXAddresses[daoId]);
    const dexAddressList = Object.values(DEXAddresses[daoId]);
    const lendingAddressList = Object.values(LendingAddresses[daoId]);
    const burningAddressList = Object.values(BurningAddresses[daoId]);
    const treasuryAddressList = Object.values(TreasuryAddresses[daoId]);
    const nonCirculatingAddressList = Object.values(
      NonCirculatingAddresses[daoId],
    );

    await tokenTransfer(
      context,
      daoId,
      {
        from,
        to,
        value,
        token: address,
        transactionHash: event.transaction.hash,
        timestamp,
        logIndex: event.log.logIndex,
      },
      {
        cex: cexAddressList,
        dex: dexAddressList,
        lending: lendingAddressList,
        burning: burningAddressList,
      },
    );

    await updateSupplyMetric(
      context,
      "lendingSupply",
      lendingAddressList,
      MetricTypesEnum.LENDING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "cexSupply",
      cexAddressList,
      MetricTypesEnum.CEX_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "dexSupply",
      dexAddressList,
      MetricTypesEnum.DEX_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "treasury",
      treasuryAddressList,
      MetricTypesEnum.TREASURY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "nonCirculatingSupply",
      nonCirculatingAddressList,
      MetricTypesEnum.NON_CIRCULATING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateTotalSupply(
      context,
      burningAddressList,
      MetricTypesEnum.TOTAL_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateCirculatingSupply(context, daoId, address, timestamp);

    // Lock tracking: transfers to/from governance contract update delegatedSupply
    const normalizedTo = getAddress(to);
    const normalizedFrom = getAddress(from);

    if (normalizedTo === GOVERNANCE_ADDRESS) {
      // Locking TORN → voting power pool increases
      await updateDelegatedSupply(context, daoId, address, value, timestamp);
    } else if (normalizedFrom === GOVERNANCE_ADDRESS) {
      // Unlocking TORN → voting power pool decreases
      await updateDelegatedSupply(context, daoId, address, -value, timestamp);
    }

    if (!event.transaction.to) return;

    await handleTransaction(
      context,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.from, event.args.to],
      {
        cex: cexAddressList,
        dex: dexAddressList,
        lending: lendingAddressList,
        burning: burningAddressList,
      },
    );
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/indexer/src/indexer/torn/erc20.ts
git commit -m "feat(torn): add TORN token handler with lock-based delegatedSupply tracking"
```

---

### Task 5: Indexer Governor Handler

**Files:**

- Create: `apps/indexer/src/indexer/torn/governor.ts`

Reference: `apps/indexer/src/indexer/shu/governor.ts` (custom ProposalCreated pattern)

- [ ] **Step 1: Create governor handler**

Custom handler because Tornado Cash's `ProposalCreated` uses timestamps (not block numbers) and its `Voted` event uses `bool support` (not `uint8`). Follows SHU pattern of writing directly to schema.

```typescript
// apps/indexer/src/indexer/torn/governor.ts
import { ponder } from "ponder:registry";
import { accountPower, feedEvent, proposalsOnchain } from "ponder:schema";
import { getAddress } from "viem";

import {
  delegateChanged,
  updateProposalStatus,
  voteCast,
} from "@/eventHandlers";
import { ensureAccountExists } from "@/eventHandlers/shared";
import { CONTRACT_ADDRESSES, ProposalStatus } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

const TORN_TOKEN_ADDRESS = CONTRACT_ADDRESSES[DaoIdEnum.TORN].token.address;

const MAX_TITLE_LENGTH = 200;

function parseProposalTitle(description: string): string {
  const normalized = description.replace(/\\n/g, "\n");
  const lines = normalized.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^# /.test(trimmed)) {
      return trimmed.replace(/^# +/, "");
    }
    break;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^#{1,6}\s/.test(trimmed)) continue;
    return trimmed.length > MAX_TITLE_LENGTH
      ? trimmed.substring(0, MAX_TITLE_LENGTH) + "..."
      : trimmed;
  }

  return "";
}

export function TORNGovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.TORN;

  /**
   * ProposalCreated — custom handler (not shared proposalCreated()).
   *
   * Tornado Cash provides startTime/endTime as timestamps, not block numbers.
   * We store synthetic block numbers for schema compatibility.
   */
  ponder.on("TORNGovernor:ProposalCreated", async ({ event, context }) => {
    const { id, proposer, target, startTime, endTime, description } =
      event.args;
    const proposalIdStr = id.toString();

    await ensureAccountExists(context, proposer);

    const title = parseProposalTitle(description);

    // Convert timestamps to synthetic block numbers for schema compatibility
    const startBlockEstimate =
      Number(event.block.number) +
      Math.floor(
        (Number(startTime) - Number(event.block.timestamp)) / blockTime,
      );
    const endBlockEstimate =
      Number(event.block.number) +
      Math.floor((Number(endTime) - Number(event.block.timestamp)) / blockTime);

    await context.db.insert(proposalsOnchain).values({
      id: proposalIdStr,
      txHash: event.transaction.hash,
      daoId,
      proposerAccountId: getAddress(proposer),
      targets: [getAddress(target)],
      values: [0n],
      signatures: [],
      calldatas: [],
      startBlock: startBlockEstimate,
      endBlock: endBlockEstimate,
      title,
      description,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
      status: ProposalStatus.PENDING,
      endTimestamp: endTime,
    });

    const { votingPower: proposerVotingPower } = await context.db
      .insert(accountPower)
      .values({
        accountId: getAddress(proposer),
        daoId,
        proposalsCount: 1,
      })
      .onConflictDoUpdate((current) => ({
        proposalsCount: current.proposalsCount + 1,
      }));

    await context.db.insert(feedEvent).values({
      txHash: event.transaction.hash,
      logIndex: event.log.logIndex,
      type: "PROPOSAL",
      timestamp: event.block.timestamp,
      metadata: {
        id: proposalIdStr,
        proposer: getAddress(proposer),
        votingPower: proposerVotingPower,
        title,
      },
    });
  });

  /**
   * Voted — bool support mapped to number: true→1 (for), false→0 (against).
   * No abstain in Tornado Cash. No reason field.
   */
  ponder.on("TORNGovernor:Voted", async ({ event, context }) => {
    const { proposalId, voter, support, votes } = event.args;

    await voteCast(context, daoId, {
      proposalId: proposalId.toString(),
      voter,
      reason: "",
      support: support ? 1 : 0,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: votes,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on("TORNGovernor:ProposalExecuted", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.EXECUTED,
    );
  });

  /**
   * Delegated — governor-level delegation (not token-level).
   * Maps to delegateChanged() using the TORN token address as tokenId
   * for data model consistency.
   */
  ponder.on("TORNGovernor:Delegated", async ({ event, context }) => {
    const { account, to } = event.args;

    // Look up current delegate from accountBalance to determine previousDelegate
    const { accountBalance } = await import("ponder:schema");
    const existing = await context.db.find(accountBalance, {
      accountId: getAddress(account),
      tokenId: getAddress(TORN_TOKEN_ADDRESS),
    });
    const previousDelegate = existing?.delegate ?? getAddress(account);

    await delegateChanged(context, daoId, {
      delegator: account,
      delegate: to,
      tokenId: getAddress(TORN_TOKEN_ADDRESS),
      previousDelegate,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });
  });

  /**
   * Undelegated — reverts delegation to self.
   */
  ponder.on("TORNGovernor:Undelegated", async ({ event, context }) => {
    const { account, from } = event.args;

    await delegateChanged(context, daoId, {
      delegator: account,
      delegate: account, // reverts to self
      tokenId: getAddress(TORN_TOKEN_ADDRESS),
      previousDelegate: from,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/indexer/src/indexer/torn/governor.ts
git commit -m "feat(torn): add custom governor handler with timestamp-based proposals"
```

---

### Task 6: Indexer Entry Point and Config

**Files:**

- Create: `apps/indexer/src/indexer/torn/index.ts`
- Create: `apps/indexer/config/torn.config.ts`
- Modify: `apps/indexer/ponder.config.ts`
- Modify: `apps/indexer/src/index.ts`

- [ ] **Step 1: Create index re-export**

```typescript
// apps/indexer/src/indexer/torn/index.ts
export { TORNTokenAbi, TORNGovernorAbi } from "./abi";
export { TORNTokenIndexer } from "./erc20";
export { TORNGovernorIndexer } from "./governor";
```

- [ ] **Step 2: Create Ponder config**

```typescript
// apps/indexer/config/torn.config.ts
import { createConfig } from "ponder";

import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { env } from "@/env";
import { TORNTokenAbi, TORNGovernorAbi } from "@/indexer/torn/abi";

const TORN_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.TORN];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    ethereum_mainnet: {
      id: 1,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    TORNToken: {
      abi: TORNTokenAbi,
      chain: "ethereum_mainnet",
      address: TORN_CONTRACTS.token.address,
      startBlock: TORN_CONTRACTS.token.startBlock,
    },
    TORNGovernor: {
      abi: TORNGovernorAbi,
      chain: "ethereum_mainnet",
      address: TORN_CONTRACTS.governor.address,
      startBlock: TORN_CONTRACTS.governor.startBlock,
    },
  },
});
```

- [ ] **Step 3: Wire into ponder.config.ts**

Add import and spread into the merged config, following the existing pattern.

```typescript
import tornConfig from "./config/torn.config";
// ...spread into chains/contracts
```

- [ ] **Step 4: Wire into src/index.ts**

Add import and switch case:

```typescript
import { TORNTokenIndexer, TORNGovernorIndexer } from "@/indexer/torn";

// In switch:
case DaoIdEnum.TORN: {
  TORNTokenIndexer(token.address, token.decimals);
  TORNGovernorIndexer(blockTime);
  break;
}
```

- [ ] **Step 5: Typecheck and lint**

```bash
cd /home/nodeful/anticapture/.worktrees/tornado-cash && pnpm indexer typecheck && pnpm indexer lint
```

- [ ] **Step 6: Commit**

```bash
git add apps/indexer/src/indexer/torn/index.ts apps/indexer/config/torn.config.ts apps/indexer/ponder.config.ts apps/indexer/src/index.ts
git commit -m "feat(torn): wire TORN indexer into Ponder config and entry point"
```

---

### Task 7: INTEGRATION.md

**Files:**

- Create: `apps/indexer/src/indexer/torn/INTEGRATION.md`

- [ ] **Step 1: Create INTEGRATION.md**

Document the architecture, what's integrated, what's pending, and verification results. Follow the template from the DAO integration skill. Include:

1. Architecture table (Token, Governor, Staking, Vault contracts)
2. Governor voting token: `lockedBalance` in Governance contract (not standard delegation)
3. What's integrated checklist
4. What's pending (votingPowerHistory, abstain votes, vote extension, staking rewards, etc.)
5. Notes on custom governance, OFAC sanctions context, governance attack history

- [ ] **Step 2: Commit**

```bash
git add apps/indexer/src/indexer/torn/INTEGRATION.md
git commit -m "docs(torn): add INTEGRATION.md documenting architecture and gaps"
```

---

### Task 8: API Constants and Client

**Files:**

- Modify: `apps/api/src/lib/constants.ts`
- Create: `apps/api/src/clients/torn/abi.ts`
- Create: `apps/api/src/clients/torn/index.ts`
- Modify: `apps/api/src/clients/index.ts`
- Modify: `apps/api/src/lib/client.ts`

- [ ] **Step 1: Add API constants**

Add `CONTRACT_ADDRESSES[DaoIdEnum.TORN]` to `apps/api/src/lib/constants.ts` mirroring the indexer, and `TreasuryAddresses[DaoIdEnum.TORN]`.

- [ ] **Step 2: Create API governor ABI**

```typescript
// apps/api/src/clients/torn/abi.ts
// Tornado Cash uses SCREAMING_SNAKE_CASE function names
export const TORNGovernorAbi = [
  {
    type: "function",
    name: "QUORUM_VOTES",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "VOTING_DELAY",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "VOTING_PERIOD",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PROPOSAL_THRESHOLD",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "EXECUTION_DELAY",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "EXECUTION_EXPIRATION",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;
```

- [ ] **Step 3: Create TORNClient**

```typescript
// apps/api/src/clients/torn/index.ts
import { Account, Address, Chain, Client, Transport } from "viem";

import { DAOClient } from "@/clients";
import { ProposalStatus } from "@/lib/constants";

import { GovernorBase } from "../governor.base";

import { TORNGovernorAbi } from "./abi";

// On-chain governance parameters (cached after first RPC call)
// These are in SECONDS, not blocks — Tornado Cash uses timestamp-based governance
const BLOCK_TIME = 12;

export class TORNClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected address: Address;
  protected abi: typeof TORNGovernorAbi;
  private executionDelay?: bigint;
  private executionExpiration?: bigint;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = TORNGovernorAbi;
  }

  getDaoId(): string {
    return "TORN";
  }

  async getQuorum(_proposalId: string | null): Promise<bigint> {
    return this.getCachedQuorum(async () => {
      return (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "QUORUM_VOTES",
        args: [],
      })) as bigint;
    });
  }

  async getVotingDelay(): Promise<bigint> {
    if (!this.cache.votingDelay) {
      this.cache.votingDelay = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "VOTING_DELAY",
        args: [],
      })) as bigint;
    }
    return this.cache.votingDelay!;
  }

  async getVotingPeriod(): Promise<bigint> {
    if (!this.cache.votingPeriod) {
      this.cache.votingPeriod = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "VOTING_PERIOD",
        args: [],
      })) as bigint;
    }
    return this.cache.votingPeriod!;
  }

  async getProposalThreshold(): Promise<bigint> {
    if (!this.cache.proposalThreshold) {
      this.cache.proposalThreshold = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "PROPOSAL_THRESHOLD",
        args: [],
      })) as bigint;
    }
    return this.cache.proposalThreshold!;
  }

  async getTimelockDelay(): Promise<bigint> {
    if (!this.executionDelay) {
      this.executionDelay = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "EXECUTION_DELAY",
        args: [],
      })) as bigint;
    }
    return this.executionDelay;
  }

  private async getExecutionExpiration(): Promise<bigint> {
    if (!this.executionExpiration) {
      this.executionExpiration = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "EXECUTION_EXPIRATION",
        args: [],
      })) as bigint;
    }
    return this.executionExpiration;
  }

  /**
   * Tornado Cash uses timestamp-based governance — override block-based logic.
   *
   * State machine (all timestamp comparisons):
   *   currentTimestamp < startTime → PENDING
   *   currentTimestamp < endTime → ACTIVE
   *   forVotes <= againstVotes || forVotes < quorum → DEFEATED
   *   proposal.executed (status === EXECUTED) → EXECUTED
   *   currentTimestamp < endTime + EXECUTION_DELAY → QUEUED (Timelocked)
   *   currentTimestamp < endTime + EXECUTION_DELAY + EXECUTION_EXPIRATION → PENDING_EXECUTION
   *   else → EXPIRED
   */
  async getProposalStatus(
    proposal: {
      id: string;
      status: string;
      startBlock: number;
      endBlock: number;
      forVotes: bigint;
      againstVotes: bigint;
      abstainVotes: bigint;
      endTimestamp: bigint;
    },
    currentBlock: number,
    currentTimestamp: number,
  ): Promise<string> {
    // Already finalized by indexer event
    if (proposal.status === ProposalStatus.EXECUTED) {
      return ProposalStatus.EXECUTED;
    }

    const now = BigInt(currentTimestamp);
    const endTime = proposal.endTimestamp;

    // Estimate startTime from synthetic startBlock
    const startTime =
      endTime -
      BigInt(proposal.endBlock - proposal.startBlock) * BigInt(BLOCK_TIME);

    // Before voting
    if (now < startTime) {
      return ProposalStatus.PENDING;
    }

    // During voting
    if (now < endTime) {
      return ProposalStatus.ACTIVE;
    }

    // After voting — check outcome
    const quorum = await this.getQuorum(proposal.id);
    const hasQuorum = proposal.forVotes >= quorum;
    const hasMajority = proposal.forVotes > proposal.againstVotes;

    if (!hasQuorum) return ProposalStatus.NO_QUORUM;
    if (!hasMajority) return ProposalStatus.DEFEATED;

    // Proposal passed — check timelock windows
    const executionDelay = await this.getTimelockDelay();
    const executionExpiration = await this.getExecutionExpiration();

    if (now < endTime + executionDelay) {
      return ProposalStatus.QUEUED;
    }

    if (now < endTime + executionDelay + executionExpiration) {
      return ProposalStatus.PENDING_EXECUTION;
    }

    return ProposalStatus.EXPIRED;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    // Tornado Cash quorum: forVotes must meet threshold (no abstain)
    return votes.forVotes;
  }

  alreadySupportCalldataReview(): boolean {
    return false;
  }
}
```

- [ ] **Step 4: Register client export**

Add to `apps/api/src/clients/index.ts`:

```typescript
export * from "./torn";
```

- [ ] **Step 5: Add to client factory**

Add to `apps/api/src/lib/client.ts` switch statement:

```typescript
case DaoIdEnum.TORN: {
  const { governor } = CONTRACT_ADDRESSES[daoId];
  return new TORNClient(client, governor.address);
}
```

Import `TORNClient` at the top.

- [ ] **Step 6: Typecheck and lint**

```bash
cd /home/nodeful/anticapture/.worktrees/tornado-cash && pnpm api typecheck && pnpm api lint
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/lib/constants.ts apps/api/src/clients/torn/ apps/api/src/clients/index.ts apps/api/src/lib/client.ts
git commit -m "feat(torn): add TORNClient with timestamp-based proposal status"
```

---

### Task 9: Dashboard Config

**Files:**

- Create: `apps/dashboard/shared/dao-config/torn.ts`
- Modify: `apps/dashboard/shared/dao-config/index.ts`

- [ ] **Step 1: Create dashboard config**

Follow `apps/dashboard/shared/dao-config/ens.ts` as template. Key differences:

- `name: "Tornado Cash"`
- `decimals: 18`
- `color: { svgColor: "#94FEBF", svgBgColor: "#1a1a2e" }`
- `daoOverview.rules.cancelFunction: false`
- `daoOverview.rules.logic: "For"` (binary voting, no abstain)
- `daoOverview.rules.quorumCalculation: "Fixed at 100,000 TORN"`
- Feature flags all true

- [ ] **Step 2: Register in index**

Add to `apps/dashboard/shared/dao-config/index.ts`:

```typescript
import { TORN } from "@/shared/dao-config/torn";
// Add TORN to the export object
```

- [ ] **Step 3: Typecheck and lint**

```bash
cd /home/nodeful/anticapture/.worktrees/tornado-cash && pnpm dashboard typecheck && pnpm dashboard lint
```

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/shared/dao-config/torn.ts apps/dashboard/shared/dao-config/index.ts
git commit -m "feat(torn): add Tornado Cash dashboard configuration"
```

---

### Task 10: Verification — Run Indexer Locally

**Prerequisites:** Local PostgreSQL and reth node available.

- [ ] **Step 1: Set up environment**

Create local `.env` for TORN indexing (don't commit):

```bash
DAO_ID=TORN
DATABASE_URL=postgresql://...
RPC_URL=http://localhost:8545  # local reth node
```

- [ ] **Step 2: Run indexer**

```bash
cd /home/nodeful/anticapture/.worktrees/tornado-cash && pnpm indexer dev
```

Let it sync. Monitor for errors.

- [ ] **Step 3: Verify proposal count**

Query the database for proposal count and compare against on-chain `proposalCount()` = 65.

- [ ] **Step 4: Verify proposal states**

For each proposal, compare indexed status against on-chain `state(proposalId)`. Map: 0=PENDING, 1=ACTIVE, 2=DEFEATED, 3=QUEUED, 4=PENDING_EXECUTION, 5=EXECUTED, 6=EXPIRED.

- [ ] **Step 5: Verify vote tallies**

For sample proposals (e.g., 1, 10, 30, 65), compare indexed `forVotes`/`againstVotes` against on-chain `proposals(id)` struct.

- [ ] **Step 6: Verify delegatedSupply**

Compare indexed `delegatedSupply` (token table) against TORN balance of governance contract:

```bash
cast call 0x77777FeDdddFfC19Ff86DB637967013e6C6A116C "balanceOf(address)(uint256)" 0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce --rpc-url <rpc>
```

- [ ] **Step 7: Verify token total supply**

Compare indexed total supply against on-chain `totalSupply()`.

- [ ] **Step 8: Document verification results in INTEGRATION.md**

---

### Task 11: Final Typecheck and PR

- [ ] **Step 1: Full monorepo typecheck**

```bash
cd /home/nodeful/anticapture/.worktrees/tornado-cash && pnpm typecheck
```

- [ ] **Step 2: Full lint**

```bash
cd /home/nodeful/anticapture/.worktrees/tornado-cash && pnpm lint
```

- [ ] **Step 3: Fix any errors**

- [ ] **Step 4: Open PR**

```bash
gh pr create --base dev --title "feat: integrate Tornado Cash DAO (TORN)" --body "..."
```
