# DAO Integration Guide - Anticapture Indexer

This guide provides step-by-step instructions for integrating a new DAO into the anticapture indexer.

## Overview

The anticapture indexer uses a modular architecture where each DAO has its own configuration, client implementation, and event handlers. Integration follows a consistent pattern across all supported DAOs.

## Architecture Pattern

```
apps/indexer/
├── config/
│   └── [dao-name].config.ts     # DAO-specific ponder configuration
├── src/
│   ├── lib/
│   │   ├── enums.ts             # Add DAO ID to DaoIdEnum
│   │   └── constants.ts         # Add contract addresses
│   └── indexer/
│       └── [dao-name]/
│           ├── abi/
│           │   ├── index.ts     # Export all ABIs
│           │   └── *.ts         # Individual ABI files
│           ├── client.ts        # Governor interface implementation
│           ├── governor.ts      # Governance event handlers
│           ├── erc20.ts        # Token event handlers
│           └── index.ts        # Export all modules
└── ponder.config.ts            # Import and merge DAO configs
```

## Step-by-Step Integration

### 1. Add DAO Identifier

Add your DAO's identifier to the enum:

**File**: `apps/indexer/src/lib/enums.ts`
```typescript
export enum DaoIdEnum {
  UNI = "UNI",
  ENS = "ENS",
  ARB = "ARB",
  OP = "OP",
  SHU = "SHU",
  NEW_DAO = "NEW_DAO", // Add your DAO here
}
```

### 2. Add Contract Addresses

Add your DAO's contract addresses and metadata to constants:

**File**: `apps/indexer/src/lib/constants.ts`
```typescript
export const CONTRACT_ADDRESSES = {
  // ... existing DAOs
  [DaoIdEnum.NEW_DAO]: {
    blockTime: 12, // Average block time in seconds for the chain
    token: {
      address: "0x...", // Token contract address
      decimals: 18,     // Token decimals
      startBlock: 12345678, // Block number to start indexing from
    },
    governor: {
      address: "0x...", // Governor contract address  
      startBlock: 12345678, // Block number to start indexing from
    },
    // Add other contracts as needed (timelock, etc.)
  },
  // ...
};
```

Also add entries to `TREASURY_ADDRESSES` and `CEXAddresses` if applicable (can be empty objects initially).

### 3. Create DAO Configuration

Create a ponder configuration file for your DAO:

**File**: `apps/indexer/config/[dao-name].config.ts`
```typescript
import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import { NewDaoTokenAbi, NewDaoGovernorAbi } from "@/indexer/new-dao/abi";

const NEW_DAO_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.NEW_DAO];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    ethereum_mainnet: { // or appropriate chain
      id: 1,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    NewDaoToken: {
      abi: NewDaoTokenAbi,
      chain: "ethereum_mainnet",
      address: NEW_DAO_CONTRACTS.token.address,
      startBlock: NEW_DAO_CONTRACTS.token.startBlock,
    },
    NewDaoGovernor: {
      abi: NewDaoGovernorAbi,
      chain: "ethereum_mainnet", 
      address: NEW_DAO_CONTRACTS.governor.address,
      startBlock: NEW_DAO_CONTRACTS.governor.startBlock,
    },
    // Add other contracts as needed
  },
});
```

### 4. Create ABI Files

Create the ABI directory and files:

**Directory**: `apps/indexer/src/indexer/[dao-name]/abi/`

Create individual ABI files (e.g., `NewDaoTokenAbi.ts`, `NewDaoGovernorAbi.ts`) with the contract ABIs:

```typescript
// NewDaoTokenAbi.ts
export const NewDaoTokenAbi = [
  // Your token ABI here
] as const;
```

Create an index file to export all ABIs:

**File**: `apps/indexer/src/indexer/[dao-name]/abi/index.ts`
```typescript
export { NewDaoTokenAbi } from "./NewDaoTokenAbi";
export { NewDaoGovernorAbi } from "./NewDaoGovernorAbi";
// Export other ABIs as needed
```

### 5. Implement Governor Client

Create a client that implements the Governor interface:

**File**: `apps/indexer/src/indexer/[dao-name]/client.ts`
```typescript
import { Account, Address, Chain, Client, Transport } from "viem";
import { readContract } from "viem/actions";

import { Governor } from "@/interfaces/governor";
import { NewDaoGovernorAbi } from "./abi";

export class NewDaoGovernor<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
> implements Governor
{
  private client: Client<TTransport, TChain, TAccount>;
  private abi: typeof NewDaoGovernorAbi;
  private address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    this.client = client;
    this.address = address;
    this.abi = NewDaoGovernorAbi;
  }

  async getQuorum(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "quorum", // Adjust function name as needed
    });
  }

  async getProposalThreshold(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "proposalThreshold",
    });
  }

  async getVotingDelay(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "votingDelay",
    });
  }

  async getVotingPeriod(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "votingPeriod",
    });
  }

  async getTimelockDelay(): Promise<bigint> {
    // Return appropriate timelock delay or 0n if none
    return 0n;
  }
}
```

### 6. Create Governor Event Handlers

Create governance event handlers:

**File**: `apps/indexer/src/indexer/[dao-name]/governor.ts`
```typescript
import { ponder } from "ponder:registry";

import { upsertProposal, voteCast } from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { Governor } from "@/interfaces/governor";
import { dao } from "ponder:schema";

export function NewDaoGovernanceIndexer(governor: Governor) {
  const daoId = DaoIdEnum.NEW_DAO;

  ponder.on(`NewDaoGovernor:setup`, async ({ context }) => {
    const [
      votingPeriod,
      quorum,
      votingDelay,
      timelockDelay,
      proposalThreshold,
    ] = await Promise.all([
      governor.getVotingPeriod(),
      governor.getQuorum(),
      governor.getVotingDelay(),
      governor.getTimelockDelay(),
      governor.getProposalThreshold(),
    ]);

    await context.db.insert(dao).values({
      id: daoId,
      votingPeriod,
      quorum,
      votingDelay,
      timelockDelay,
      proposalThreshold,
    });
  });

  // Handle proposal creation
  ponder.on("NewDaoGovernor:ProposalCreated", async ({ event, context }) => {
    await upsertProposal(context, daoId, {
      id: event.args.proposalId,
      proposer: event.args.proposer,
      targets: event.args.targets,
      values: event.args.values,
      signatures: event.args.signatures,
      calldatas: event.args.calldatas,
      description: event.args.description,
      startBlock: event.args.startBlock,
      endBlock: event.args.endBlock,
      transactionHash: event.transaction.hash,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    });
  });

  // Handle vote casting
  ponder.on("NewDaoGovernor:VoteCast", async ({ event, context }) => {
    await voteCast(context, daoId, {
      proposalId: event.args.proposalId,
      voter: event.args.voter,
      support: event.args.support,
      weight: event.args.weight,
      reason: event.args.reason || "",
      transactionHash: event.transaction.hash,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    });
  });

  // Add other governance event handlers as needed
}
```

### 7. Create Token Event Handlers

Create token event handlers:

**File**: `apps/indexer/src/indexer/[dao-name]/erc20.ts`
```typescript
import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";

export function NewDaoTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.NEW_DAO;

  ponder.on("NewDaoToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on("NewDaoToken:Transfer", async ({ event, context }) => {
    await tokenTransfer(context, daoId, {
      from: event.args.from,
      to: event.args.to,
      tokenAddress: address,
      transactionHash: event.transaction.hash,
      value: event.args.value,
      timestamp: event.block.timestamp,
    });
  });

  ponder.on("NewDaoToken:DelegateChanged", async ({ event, context }) => {
    await delegateChanged(context, daoId, {
      delegator: event.args.delegator,
      fromDelegate: event.args.fromDelegate,
      toDelegate: event.args.toDelegate,
      transactionHash: event.transaction.hash,
      timestamp: event.block.timestamp,
    });
  });

  ponder.on("NewDaoToken:DelegateVotesChanged", async ({ event, context }) => {
    await delegatedVotesChanged(context, daoId, {
      delegate: event.args.delegate,
      previousBalance: event.args.previousBalance,
      newBalance: event.args.newBalance,
      transactionHash: event.transaction.hash,
      timestamp: event.block.timestamp,
    });
  });
}
```

### 8. Create Module Index

Create an index file to export all DAO modules:

**File**: `apps/indexer/src/indexer/[dao-name]/index.ts`
```typescript
export * from "./abi";
export * from "./client";
export * from "./governor";
export * from "./erc20";
```

### 9. Update Main Configuration

Update the main ponder configuration to include your DAO:

**File**: `apps/indexer/ponder.config.ts`
```typescript
import arbitrumConfig from "./config/arbitrum.config";
import ensConfig from "./config/ens.config";
import uniswapConfig from "./config/uniswap.config";
import optimismConfig from "./config/optimism.config";
import shutterConfig from "./config/shutter.config";
import newDaoConfig from "./config/new-dao.config"; // Add import

export default {
  chains: {
    ...arbitrumConfig.chains,
    ...ensConfig.chains,
    ...uniswapConfig.chains,
    ...optimismConfig.chains,
    ...shutterConfig.chains,
    ...newDaoConfig.chains, // Add chains
  },
  contracts: {
    ...arbitrumConfig.contracts,
    ...ensConfig.contracts,
    ...uniswapConfig.contracts,
    ...optimismConfig.contracts,
    ...shutterConfig.contracts,
    ...newDaoConfig.contracts, // Add contracts
  },
};
```

## Key Requirements

### Governor Interface
Your client must implement all methods in the `Governor` interface:
- `getVotingDelay(): Promise<bigint>`
- `getVotingPeriod(): Promise<bigint>`  
- `getTimelockDelay(): Promise<bigint>`
- `getQuorum(): Promise<bigint>`
- `getProposalThreshold(): Promise<bigint>`

### Event Handler Patterns
- Use shared event handlers from `@/eventHandlers` when possible
- Follow consistent naming patterns for contract events
- Include setup handlers for initial data seeding

### Configuration Consistency
- Use environment variables for chain configuration
- Include appropriate start blocks to avoid indexing unnecessary history
- Follow the existing naming patterns for contracts

## Testing Your Integration

1. Ensure all TypeScript types are correct
2. Test that the configuration compiles without errors
3. Verify that event handlers process events correctly
4. Confirm that the Governor client can read contract data

## Common Pitfalls

- **Incorrect ABI**: Ensure your ABI matches the deployed contract
- **Wrong start blocks**: Set appropriate start blocks to avoid performance issues
- **Missing exports**: Remember to export all modules in index files
- **Event name mismatches**: Contract event names must match exactly
- **Chain configuration**: Ensure you're using the correct chain for your contracts 