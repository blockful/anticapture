---
name: dashboard-dao
description: Use when adding a new DAO to the Anticapture dashboard. Walks through enum registration, config creation, quorum label, icon setup, and wiring — with exact file paths and a worked example (FLUID).
---

# Add a DAO to the Dashboard

## Use This Skill When

- You need to add a new DAO to the dashboard.
- A DAO already has indexer + API integration and now needs dashboard visibility.
- You are debugging why a DAO does not appear in the dashboard navigation.

## Prerequisites

Before starting, you need:

- **DAO ID**: The uppercase identifier already present in the indexer/API enums (e.g. `FLUID`, `LIL_NOUNS`)
- **Contract addresses**: Token, Governor, Timelock (from `apps/api/src/lib/constants.ts` or `apps/indexer/src/lib/constants.ts`)
- **Governance rules**: Voting delay, period, quorum logic, vote change, cancel function, timelock — from the API client (`apps/api/src/clients/<dao>/index.ts`)
- **Chain**: Which EVM chain (mainnet, arbitrum, scroll, etc.)
- **Brand colors**: `svgColor` (foreground) and `svgBgColor` (background) hex values
- **Token type**: `"ERC20"` or `"ERC721"`

## Step-by-Step Checklist

### 1. Add enum entry (`apps/dashboard/shared/types/daos.ts`)

> **If coming from the `dao-integration` skill**, this is already done in its Step 1 (Enum Sync). Skip to step 2.

Add the DAO to `DaoIdEnum` in alphabetical order:

```typescript
export enum DaoIdEnum {
  // ... existing entries ...
  FLUID = "FLUID", // <-- value must match indexer/API enums exactly
  // ...
}
```

**The enum value must be identical across indexer, API, and dashboard.**

### 2. Create DAO config (`apps/dashboard/shared/dao-config/<dao>.ts`)

Create the config file exporting a `DaoConfiguration` object. Reference file: `apps/dashboard/shared/dao-config/fluid.ts`.

```typescript
import { mainnet } from "viem/chains";

import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import { EnsOgIcon } from "@/shared/og/dao-og-icons"; // placeholder until real icon

export const NEW_DAO: DaoConfiguration = {
  name: "New DAO",
  decimals: 18,
  color: {
    svgColor: "#...", // foreground/text color
    svgBgColor: "#...", // background/accent color
  },
  ogIcon: EnsOgIcon, // placeholder — replace with real OG icon later
  // icon: NewDaoIcon, // uncomment when icon component exists

  daoOverview: {
    token: "ERC20", // or "ERC721" for NFT-based DAOs
    chain: { ...mainnet, icon: MainnetIcon },
    contracts: {
      governor: "0x...",
      token: "0x...",
      timelock: "0x...",
    },
    // Optional: governance platform link (proposal IDs get appended)
    govPlatform: {
      name: "Tally",
      url: "https://tally.xyz/gov/<dao>/proposal/",
    },
    // Optional: Snapshot space
    // snapshot: "https://snapshot.box/#/s:<dao>.eth/proposals",
    // Optional: direct link to cancel function on Etherscan
    // cancelFunction: "https://etherscan.io/address/0x...#writeContract#F1",
    rules: {
      delay: true, // has voting delay?
      changeVote: false, // can voters change their vote?
      timelock: true, // has timelock?
      cancelFunction: false, // has public cancel function?
      logic: "For", // "For" | "For + Abstain" | "For + Abstain + Against" | "All Votes Cast"
      quorumCalculation: QUORUM_CALCULATION_TYPES.NEW_DAO,
      // proposalThreshold: "100K $TOKEN",  // optional display string
    },
  },

  // Feature flags — enable based on what the indexer/API supports
  tokenDistribution: true,
  dataTables: true,
  activityFeed: true,
  governancePage: true,
  // resilienceStages: true,   // requires governanceImplementation fields
  // riskAnalysis: true,       // requires governanceImplementation fields
  // serviceProviders: true,   // if DAO has service provider data
};
```

#### Key decisions for the config

| Field                | How to determine                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`              | `"ERC20"` or `"ERC721"` — check the indexer's token handler                                                                                                                                    |
| `logic`              | Check `calculateQuorum()` in `apps/api/src/clients/<dao>/index.ts`                                                                                                                             |
| `delay` / `timelock` | Check if governor has voting delay > 0 and a timelock contract                                                                                                                                 |
| `changeVote`         | Check if governor supports `castVote` override (rare, most are `false`)                                                                                                                        |
| `cancelFunction`     | Check if there's a public `cancel()` on the governor or timelock                                                                                                                               |
| Feature flags        | Enable `tokenDistribution`, `dataTables`, `governancePage` for any DAO with full indexer+API. Only enable `resilienceStages`/`riskAnalysis` if `governanceImplementation` fields are populated |

#### Variations by DAO type

| Type                       | Config differences                                                                   | Example         |
| -------------------------- | ------------------------------------------------------------------------------------ | --------------- |
| Standard ERC20 + Governor  | Straightforward, follow FLUID/COMP                                                   | FLUID, ENS, UNI |
| ERC721 (NFT)               | `token: "ERC721"`, add `notSupportedMetrics` for CEX/DEX/lending, `priceDisclaimer`  | NOUNS           |
| Multi-token                | `contracts.token` is an array of `{ label, address }`                                | AAVE            |
| Multi-chain                | Import chain from `viem/chains` (e.g. `scroll`, `arbitrum`), use chain-specific icon | SCR, ARB        |
| No governor                | Omit `governor` from `contracts`, disable `governancePage`                           | ARB             |
| Minimal (data tables only) | Only set `dataTables: true`, skip other feature flags                                | AAVE            |

### 4. Register config (`apps/dashboard/shared/dao-config/index.ts`)

Import the config and add it to the default export:

```typescript
import { FLUID } from "@/shared/dao-config/fluid";

export default {
  // ... existing entries ...
  FLUID,
  // ...
} as const;
```

### 5. Icons (optional, can be deferred)

If you have the DAO's SVG logo:

**a. Main icon** — Create `apps/dashboard/shared/components/icons/<DaoName>Icon.tsx`:

```typescript
import type { DaoIconProps } from "@/shared/components/icons/types";

export const FluidIcon = ({ showBackground = true, ...props }: DaoIconProps) => {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" {...props}>
      {showBackground && <rect width="40" height="40" fill="#6C63FF" />}
      {/* SVG paths here */}
    </svg>
  );
};
```

Then export from `apps/dashboard/shared/components/icons/index.ts`:

```typescript
export * from "@/shared/components/icons/FluidIcon";
```

**b. OG icon** — Add to `apps/dashboard/shared/og/dao-og-icons.tsx`:

```typescript
const FILL = "#EC762E"; // Anticapture accent orange — must use this color

export function FluidOgIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Same paths as main icon but with fill={FILL} */}
    </svg>
  );
}
```

**c. Update the DAO config** to use the real icons:

```typescript
import { FluidIcon } from "@/shared/components/icons";
import { FluidOgIcon } from "@/shared/og/dao-og-icons";

export const FLUID: DaoConfiguration = {
  icon: FluidIcon,
  ogIcon: FluidOgIcon,
  // ...
};
```

If you don't have the logo yet, use any existing OG icon as a placeholder (e.g. `EnsOgIcon`) and omit the `icon` field entirely. The dashboard renders without it.

### 6. Governance implementation (optional, for risk analysis)

For full resilience stages and risk analysis, add `governanceImplementation` and `attackExposure` fields. See `apps/dashboard/shared/dao-config/comp.ts` or `apps/dashboard/shared/dao-config/obol.ts` as comprehensive examples. This requires manual security assessment and should be done separately.

## Verification

```bash
pnpm dashboard typecheck
pnpm dashboard lint
```

Both must pass with 0 errors. Pre-existing warnings are acceptable.

## Quick Reference: All Files Touched

| #   | File                                                   | Action                 |
| --- | ------------------------------------------------------ | ---------------------- |
| 1   | `apps/dashboard/shared/types/daos.ts`                  | Add enum entry         |
| 2   | `apps/dashboard/shared/constants/labels.ts`            | Add quorum label       |
| 3   | `apps/dashboard/shared/dao-config/<dao>.ts`            | Create config file     |
| 4   | `apps/dashboard/shared/dao-config/index.ts`            | Import + register      |
| 5   | `apps/dashboard/shared/components/icons/<Dao>Icon.tsx` | Create icon (optional) |
| 6   | `apps/dashboard/shared/components/icons/index.ts`      | Export icon (optional) |
| 7   | `apps/dashboard/shared/og/dao-og-icons.tsx`            | Add OG icon (optional) |

## Worked Example: FLUID

FLUID is a standard ERC20 + CompoundGovernor on mainnet. The full config is at `apps/dashboard/shared/dao-config/fluid.ts`. Key choices:

- `logic: "For"` — quorum counts only `forVotes` (from `calculateQuorum()` in API client)
- `cancelFunction: false` — no public cancel function
- `changeVote: false` — immutable votes
- `delay: true`, `timelock: true` — has both voting delay and ~2-day timelock
- No `resilienceStages` or `governanceImplementation` — risk analysis not yet done
- No `icon` — logo SVG not yet provided, `ogIcon` uses `EnsOgIcon` placeholder
