# SPP Data Externalization Design

## Problem

Service provider metadata (name, budget, website, proposal URL, SPP program, stream duration, due dates) was hardcoded in `ens-service-providers.ts`. Adding a provider, changing a budget, or extending to a new year required a dashboard code change. External contributors and service providers could not self-serve.

## Solution

All service provider and program data now lives in the external [`blockful/spp-accountability`](https://github.com/blockful/spp-accountability) GitHub repo. The dashboard fetches two JSON files at runtime and renders everything dynamically.

## External Data (spp-accountability repo)

### `programs.json`

Program definitions with governance context:

```json
{
  "SPP2": {
    "name": "Service Provider Program Season 2",
    "year1Quarters": ["2025/Q3", "2025/Q4", "2026/Q1", "2026/Q2"],
    "year2Quarters": ["2026/Q3", "2026/Q4", "2027/Q1", "2027/Q2"],
    "budget": 4500000,
    "startDate": "2025-05-26",
    "discussionUrl": "https://discuss.ens.domains/t/...",
    "budgetProposal": {
      "id": "EP 6.3",
      "forumUrl": "...",
      "snapshotUrl": "..."
    },
    "selectionProposal": {
      "id": "EP 6.10",
      "forumUrl": "...",
      "snapshotUrl": "..."
    }
  }
}
```

### `providers.json`

Provider metadata and quarterly report URLs:

```json
{
  "providers": [
    {
      "name": "Blockful",
      "slug": "blockful",
      "website": "https://blockful.io",
      "programs": {
        "SPP1": { "budget": 300000, "streamDuration": 1 },
        "SPP2": { "budget": 700000, "streamDuration": 2 }
      },
      "reports": {
        "2025/Q1": "https://discuss.ens.domains/t/...",
        "2025/Q2": "https://discuss.ens.domains/t/..."
      }
    }
  ]
}
```

### Validation

- JSON Schemas (`providers.schema.json`, `programs.schema.json`) enforce types, required fields, patterns
- `validate.mjs` adds cross-referential checks (program key references, quarter validity, alphabetical sort)
- GitHub Actions CI runs on every PR

## Dashboard Architecture

### Fetch flow

1. Fetch `providers.json`, `programs.json`, and avatar URLs — all in parallel
2. Parse program configs → build `ProgramDefinition` with parsed quarter objects
3. For each provider × year × quarter, check if report URL exists in `provider.reports`
4. Compute due dates from quarter keys (Q1→Mar 31, Q2→Jun 30, Q3→Sep 30, Q4→Dec 31)
5. Build `ServiceProvider[]` for rendering

### Key types

```typescript
type ProgramDefinition = {
  name: string;
  year1Quarters: ParsedQuarter[];
  year2Quarters: ParsedQuarter[];
  discussionUrl: string;
  budgetProposal: ProgramProposal;
  selectionProposal: ProgramProposal;
};

type ServiceProvider = {
  name: string;
  avatarUrl?: string;
  websiteUrl?: string;
  proposalUrl?: string;
  budget: number;
  githubSlug: string;
  streamDuration: 1 | 2;
  years: Record<number, YearData>;
};
```

### Files changed

| File                           | Change                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `types.ts`                     | `ProgramsConfig`, `ProgramConfig`, `ProgramProposal`, `ProviderEntry`, `ProgramDefinition` |
| `fetchServiceProvidersData.ts` | Fetch both JSON files + avatars in parallel, no tree scanning                              |
| `useServiceProvidersData.ts`   | Return `programs`, `programKeys`, `getProvidersForProgram()`                               |
| `ens-service-providers.ts`     | Stripped to GitHub URL constants only                                                      |
| `ServiceProvidersSection.tsx`  | Dynamic program tabs with DISCUSSION · EP links                                            |
| `ServiceProvidersTable.tsx`    | Dynamic columns from `ProgramDefinition`                                                   |
| `computeQuarterStatus.ts`      | Due dates computed from quarter key                                                        |
| `extractUrlFromMarkdown.ts`    | Deleted (reports are URLs in JSON now)                                                     |

### Components unchanged

- `StatusCell.tsx`
- `ProviderNameCell.tsx`
- `page.tsx`

## Contribution Flow

**Submit a quarterly report:** Edit `providers.json`, add report URL to `reports` object, open PR.

**Register as a new provider:** Add entry to `providers.json`, add avatar, open PR.

**Add a new SPP program:** Add to `programs.json` with governance links, add provider entries in `providers.json`, open PR. Dashboard discovers the new tab automatically.
