---
name: dao-integration
description: Use when adding a new DAO to the Anticapture platform. Covers all five components — indexer, API, gateway, dashboard, and enum sync — with a step-by-step checklist.
---

# DAO Integration Guide

## Use This Skill When

- You are adding a new DAO to the platform.
- You need to understand what files to create/modify for a new DAO.
- You are debugging why a DAO is missing from a component.

## Prerequisites

Before starting, gather these details about the DAO:

- **DAO ID**: Short uppercase identifier (e.g. `ENS`, `UNI`, `AAVE`)
- **Chain**: Which EVM chain (mainnet, arbitrum, optimism, etc.)
- **Token contract**: Address, decimals, deploy block, type (ERC20/ERC721)
- **Governor contract**: Address, deploy block, governor type (Compound-style, Azorius, etc.)
- **Timelock contract**: Address (if applicable)
- **Treasury addresses**: DAO multisigs, vesting contracts
- **CEX/DEX/Lending addresses**: Known exchange wallets, LP pools, lending contracts holding the token
- **Governance rules**: Voting delay, period, quorum calculation, cancel function, vote logic

## Integration Checklist

The integration touches 5 components. Work through them in order.

### Step 0: Governance Architecture Discovery

**This step is mandatory before writing any code.** Many DAOs have non-standard governance architectures. Skipping this step risks building an integration that misses the core governance mechanism.

#### 0a. Verify the governor's voting token

Call `governor.token()` on-chain to find what contract the governor actually uses for voting power:

```bash
cast call <GOVERNOR_ADDRESS> "token()(address)" --rpc-url <RPC_URL>
```

Compare the result against the token address the user provided. They may differ — e.g. the governor may point to a vote-escrow wrapper, not the ERC20.

#### 0b. Classify the voting token

Check what the voting token actually is:

| Check | Command | What it tells you |
|---|---|---|
| Is it the same as the ERC20? | Compare addresses | If different, there's an intermediary |
| Does it have `delegates()`? | `cast call <TOKEN> "delegates(address)(address)" <ZERO_ADDR>` | If reverts → no delegation, voting power comes from elsewhere |
| Does it emit `DelegateChanged`? | Check ABI on block explorer | If missing → `delegatedSupply` and `accountPower` will be empty |
| Is it a vote-escrow (veToken)? | Check contract name/source on block explorer | veTokens use lock-based voting power with `Deposit`/`Withdraw` events |
| Is it a wrapper? | Check if it references another contract | Wrappers (like wveOLAS) proxy reads to an underlying contract |

#### 0c. Determine integration scope

Based on the findings, classify the integration:

| Architecture | Token events available | Delegation tracking | Example |
|---|---|---|---|
| **Standard ERC20Votes** | Transfer, DelegateChanged, DelegateVotesChanged | Full | ENS, UNI, OBOL |
| **Plain ERC20 + veToken** | Transfer only (on ERC20); Deposit/Withdraw (on veToken) | Requires custom veToken indexing | OLAS |
| **ERC721 (NFT)** | Transfer (minting = delegation) | Via transfer events | NOUNS |
| **Multi-token** | Transfer + delegation per token | Aggregated across tokens | AAVE |

#### 0d. Document findings in INTEGRATION.md

Create `apps/indexer/src/indexer/<dao>/INTEGRATION.md` documenting:

1. **Architecture**: What contracts exist and how they connect
2. **What's integrated**: Which events and metrics are covered
3. **What's pending**: Gaps that need follow-up work (e.g. veToken indexing)
4. **Addresses provided vs discovered**: Any discrepancies from user-provided info

This file is the source of truth for the integration status of each DAO. See the template below in "INTEGRATION.md Template".

### Step 1: Enum Sync

Add the DAO ID to the enum in **all three locations** (they must match):

| File                                  | Package   |
| ------------------------------------- | --------- |
| `apps/indexer/src/lib/enums.ts`       | Indexer   |
| `apps/api/src/lib/enums.ts`           | API       |
| `apps/dashboard/shared/types/daos.ts` | Dashboard |

```typescript
export enum DaoIdEnum {
  // ... existing entries ...
  NEW_DAO = "NEW_DAO",
}
```

### Step 2: Indexer

#### 2a. Constants (`apps/indexer/src/lib/constants.ts`)

Add entry to `CONTRACT_ADDRESSES[DaoIdEnum.NEW_DAO]`:

```typescript
[DaoIdEnum.NEW_DAO]: {
  blockTime: 12, // seconds per block on the chain
  token: {
    address: "0x..." as Address,
    decimals: 18,
    startBlock: 12345678,
  },
  governor: {
    address: "0x..." as Address,
    startBlock: 12345678,
  },
},
```

Add entries to `TreasuryAddresses`, `CEXAddresses`, `DEXAddresses`, `LendingAddresses`, `BurningAddresses`.

#### 2b. ABIs (`apps/indexer/src/indexer/<dao>/abi/`)

Create ABI files for the token and governor contracts. Use viem's built-in ABIs where possible, or extract from block explorer.

```
apps/indexer/src/indexer/<dao>/
├── abi/
│   └── index.ts       # exports TokenAbi, GovernorAbi
├── erc20.ts           # token event handlers (Transfer, DelegateChanged, DelegateVotesChanged)
├── governor.ts        # governor event handlers (ProposalCreated, VoteCast, etc.)
└── index.ts           # re-exports everything
```

#### 2c. Event Handlers

**Token handler** (`erc20.ts`): Follow the pattern in `apps/indexer/src/indexer/ens/erc20.ts`:

- `setup` event: Insert token record
- `Transfer`: Track balances, CEX/DEX/Lending/Treasury flows
- `DelegateChanged`: Track delegation changes
- `DelegateVotesChanged`: Track voting power changes

**Governor handler** (`governor.ts`): Follow the pattern in `apps/indexer/src/indexer/ens/governor.ts`:

- `ProposalCreated`: Insert proposal
- `VoteCast` / `VoteCastWithParams`: Record votes
- `ProposalQueued`, `ProposalExecuted`, `ProposalCanceled`: Update proposal status

#### 2d. Ponder Config (`apps/indexer/config/<dao>.config.ts`)

Follow the pattern in `apps/indexer/config/ens.config.ts`:

```typescript
import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { env } from "@/env";
import { TokenAbi, GovernorAbi } from "@/indexer/<dao>/abi";

const CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.NEW_DAO];

export default createConfig({
  database: { kind: "postgres", connectionString: env.DATABASE_URL },
  chains: {
    ethereum_mainnet: {
      id: 1,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    NEW_DAOToken: {
      abi: TokenAbi,
      chain: "ethereum_mainnet",
      address: CONTRACTS.token.address,
      startBlock: CONTRACTS.token.startBlock,
    },
    NEW_DAOGovernor: {
      abi: GovernorAbi,
      chain: "ethereum_mainnet",
      address: CONTRACTS.governor.address,
      startBlock: CONTRACTS.governor.startBlock,
    },
  },
});
```

#### 2e. Wire into Ponder (`apps/indexer/ponder.config.ts`)

Import the new config and spread its chains/contracts into the merged config.

#### 2f. Wire into entry point (`apps/indexer/src/index.ts`)

Add import and switch case:

```typescript
import { NEW_DAOTokenIndexer, NEW_DAOGovernorIndexer } from "@/indexer/<dao>";

case DaoIdEnum.NEW_DAO: {
  NEW_DAOTokenIndexer(token.address, token.decimals);
  NEW_DAOGovernorIndexer(blockTime);
  break;
}
```

### Step 3: API

#### 3a. Constants (`apps/api/src/lib/constants.ts`)

Mirror the same `CONTRACT_ADDRESSES[DaoIdEnum.NEW_DAO]` entry from the indexer.

#### 3b. Client (`apps/api/src/clients/<dao>/index.ts`)

Create a client class extending `GovernorBase` and implementing `DAOClient`:

```typescript
export class NEW_DAOClient extends GovernorBase implements DAOClient {
  // Implement: getDaoId, getQuorum, getTimelockDelay,
  // alreadySupportCalldataReview, calculateQuorum
}
```

Follow the pattern in `apps/api/src/clients/ens/index.ts`.

#### 3c. Register client (`apps/api/src/clients/index.ts`)

Add `export * from "./<dao>";`

### Step 4: Gateway

The gateway auto-discovers DAOs from `DAO_API_*` environment variables. Add:

```
DAO_API_NEW_DAO=<api-url>
```

No code changes needed unless the API exposes new endpoint patterns.

### Step 5: Dashboard

#### 5a. DAO Config (`apps/dashboard/shared/dao-config/<dao>.ts`)

Create a `DaoConfiguration` object. Follow `apps/dashboard/shared/dao-config/ens.ts` as a template. Required fields:

```typescript
export const NEW_DAO: DaoConfiguration = {
  name: "New DAO",
  decimals: 18,
  color: { svgColor: "#...", svgBgColor: "#..." },
  ogIcon: NewDaoOgIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    contracts: { governor: "0x...", token: "0x...", timelock: "0x..." },
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: false,
      logic: "For",
      quorumCalculation: "...",
    },
  },
  // Feature flags
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
  governancePage: true,
};
```

#### 5b. Register config (`apps/dashboard/shared/dao-config/index.ts`)

Import and add to the default export object.

#### 5c. Icons (optional)

Add DAO icon component in `apps/dashboard/shared/components/icons/` and OG icon in `apps/dashboard/shared/og/dao-og-icons/`.

## Verification

After all changes, run typecheck and lint on each affected package:

```bash
pnpm indexer typecheck && pnpm indexer lint
pnpm api typecheck && pnpm api lint
pnpm gateway typecheck && pnpm gateway lint
pnpm dashboard typecheck && pnpm dashboard lint
```

## Common Patterns & Variations

| Variation                          | Example DAO       | Key Difference                                      |
| ---------------------------------- | ----------------- | --------------------------------------------------- |
| Standard ERC20 + Compound Governor | ENS, UNI, GTC, OP | Straightforward, follow ENS pattern                 |
| ERC721 (NFT) token                 | NOUNS             | Token is NFT, auto-delegates on transfer            |
| Multi-token tracking               | AAVE              | Tracks AAVE + stkAAVE + aAAVE separately            |
| Azorius governance (Fractal)       | SHU               | Different governor events, custom proposal handling |
| Multi-chain                        | ARB, OP, SCR      | Config needs chain-specific RPC and chain ID        |
| No governor (token-only)           | ARB               | Only token indexer, no governor handler             |
| Vote-escrow (veToken) governance   | OLAS              | ERC20 has no delegation; voting power from veToken lock. Requires custom veToken indexer for `Deposit`/`Withdraw` events to track `delegatedSupply` and `accountPower`. Governor events are standard. |

## INTEGRATION.md Template

Every DAO integration **must** include an `INTEGRATION.md` file at `apps/indexer/src/indexer/<dao>/INTEGRATION.md`. This is the source of truth for what's integrated and what's pending.

```markdown
# <DAO_NAME> Integration Status

## Architecture

| Contract | Address | Type | Events used |
|---|---|---|---|
| Token | 0x... | ERC20 / ERC721 / veToken | Transfer, DelegateChanged, ... |
| Governor | 0x... | OZ Governor / Azorius / ... | ProposalCreated, VoteCast, ... |
| Timelock | 0x... | TimelockController | (not indexed) |

Governor voting token: `<address>` (same as token / veToken wrapper / other)

## What's Integrated

- [ ] Token supply tracking (Transfer events)
- [ ] Delegation tracking (DelegateChanged / DelegateVotesChanged)
- [ ] Voting power tracking (accountPower, votingPowerHistory)
- [ ] Governor proposals (ProposalCreated, status updates)
- [ ] Governor votes (VoteCast)
- [ ] CEX/DEX/Lending address classification
- [ ] Treasury tracking

## What's Pending

List gaps with context on why and what's needed to close them.

## Notes

Any DAO-specific quirks, discrepancies, or decisions made during integration.
```

## Guardrails

- Enums **must** be identical across indexer, API, and dashboard
- Constants (contract addresses) **must** match between indexer and API
- ABIs **must** match the deployed contracts — verify on block explorer
- Do **not** run the indexer unless explicitly asked (reindexing is expensive)
- Test the API client against the real chain before deploying
- **Always** run Step 0 (Governance Architecture Discovery) before writing code — never assume the token the user provides is the voting token
