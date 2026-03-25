# SPP Data Externalization Design

## Problem

Service provider metadata (name, budget, website, proposal URL, SPP program, stream duration, due dates) is hardcoded in `ens-service-providers.ts`. Adding a provider, changing a budget, or extending to a new year requires a dashboard code change. External contributors and service providers cannot self-serve.

## Goal

Move **all** service provider data into the external `blockful/spp-accountability` GitHub repo so that:

1. Service providers can register/update via PR to that repo (no dashboard code changes)
2. Program definitions (which quarters, year1/year2 splits) are data, not code
3. Due dates are computed from quarter definitions (always last day of quarter)
4. The dashboard dynamically reads everything from the repo at runtime

## Data Format

### `providers.json` (root of spp-accountability repo)

Single JSON file containing program definitions and all provider metadata:

```json
{
  "programs": {
    "SPP1": {
      "quarters": ["2025/Q1", "2025/Q2"]
    },
    "SPP2": {
      "year1Quarters": ["2025/Q3", "2025/Q4", "2026/Q1", "2026/Q2"],
      "year2Quarters": ["2026/Q3", "2026/Q4", "2027/Q1", "2027/Q2"]
    }
  },
  "providers": [
    {
      "name": "Blockful",
      "slug": "blockful",
      "website": "https://blockful.io",
      "programs": {
        "SPP1": {
          "proposalUrl": "https://discuss.ens.domains/t/...",
          "budget": 500000
        },
        "SPP2": {
          "proposalUrl": "https://discuss.ens.domains/t/...",
          "budget": 700000,
          "streamDuration": 2
        }
      }
    }
  ]
}
```

**Design decisions:**

- Single file (not per-provider) — only ~8 providers, avoids N+1 fetches, easy to review
- Programs define their quarter ranges — adding SPP3 = adding a key
- `streamDuration` per program per provider — defaults to 1 if omitted
- `quarters` for simple programs, `year1Quarters`/`year2Quarters` for multi-year
- Due dates derived: Q1→Mar 31, Q2→Jun 30, Q3→Sep 30, Q4→Dec 31

### Report files (unchanged)

`{year}/{slug}/{quarter}.md` — contains a markdown link to the forum post. This convention stays the same.

### Avatars (unchanged)

`avatars/{slug}.{ext}` — stays the same.

## Dashboard Changes

### New types

```typescript
// Shape of providers.json from the external repo
type ProvidersConfig = {
  programs: Record<string, ProgramConfig>;
  providers: ProviderEntry[];
};

type ProgramConfig = {
  quarters?: string[]; // e.g., ["2025/Q1", "2025/Q2"]
  year1Quarters?: string[]; // for multi-year programs
  year2Quarters?: string[];
};

type ProviderEntry = {
  name: string;
  slug: string;
  website?: string;
  programs: Record<
    string,
    {
      proposalUrl?: string;
      budget: number;
      streamDuration?: 1 | 2;
    }
  >;
};
```

### Fetch flow

1. Fetch GitHub tree (existing) + fetch `providers.json` (new) — in parallel
2. Parse providers.json → extract program defs + provider list
3. For each provider×quarter, check if report file exists (existing logic)
4. Compute due dates from quarter strings (new, replaces hardcoded dates)
5. Build `ServiceProvider[]` from the merged data

### Files changed

| File                           | Change                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| `types.ts`                     | Add `ProvidersConfig`, `ProgramConfig`, `ProviderEntry`        |
| `fetchServiceProvidersData.ts` | Fetch providers.json, derive due dates, merge data             |
| `useServiceProvidersData.ts`   | Return programs alongside providers                            |
| `ens-service-providers.ts`     | Remove hardcoded providers/dates, keep repo URLs only          |
| `ServiceProvidersSection.tsx`  | Get program keys from data, not hardcoded                      |
| `ServiceProvidersTable.tsx`    | Receive program definition as prop, derive columns dynamically |
| `computeQuarterStatus.ts`      | Use computed due dates instead of hardcoded lookup             |

### Components unchanged

- `StatusCell.tsx` — no changes needed
- `ProviderNameCell.tsx` — no changes needed
- `page.tsx` — no changes needed

## Contribution Flow (after)

To add a new service provider:

1. Fork `blockful/spp-accountability`
2. Edit `providers.json` — add an entry with name, slug, website, and program participation
3. Add avatar to `avatars/{slug}.png`
4. Submit PR

To submit a quarterly report:

1. Create `{year}/{slug}/{quarter}.md` with a link to the forum post (unchanged)
2. Submit PR

To add a new SPP program:

1. Add program definition in `providers.json` under `programs`
2. Add provider entries for the program
3. Submit PR — dashboard auto-discovers the new tab

## Implementation Plan

### Phase 1: Data file

- Create `providers.json` with real data from ENS forum
- Populate all SPP1 and SPP2 provider metadata

### Phase 2: Dashboard types + fetch

- Add new config types
- Update fetch to read providers.json
- Compute due dates dynamically
- Update hook to expose program definitions

### Phase 3: Dashboard components

- Update table to use dynamic program definitions
- Update section to use dynamic program list
- Remove hardcoded constants

### Phase 4: Verify + PR

- Run typecheck + lint
- Create PR
