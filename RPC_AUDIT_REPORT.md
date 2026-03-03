# RPC Audit Report — `eth_call` and RPC Usage

**Date**: 2026-03-02
**Scope**: Full monorepo audit of all `eth_call` (and related) RPC calls

---

## Timeline Summary — When Each RPC Source Was Introduced

| Date       | Commit      | Author             | What was introduced                                                                                                                                    | RPC Impact                                                  | Severity          |
| ---------- | ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ----------------- |
| 2025-07-11 | `87ea1ee95` | lucas picollo      | Initial DAO client abstraction with `readContract` for quorum, timelock, status                                                                        | Created all `eth_call` patterns in DAO clients              | **CRITICAL**      |
| 2025-07-29 | `47a216cf1` | lucas picollo      | `GovernorBase` class with `getProposalStatus()` calling `getCurrentBlockNumber` + `getQuorum` per proposal                                             | Per-proposal RPC multiplier in status checks                | **CRITICAL**      |
| 2025-08-07 | `a045f40c8` | lucas picollo      | Moved shared methods to `GovernorBase` (proposalThreshold, votingDelay, votingPeriod)                                                                  | Added 3 cached `eth_call`s to base class                    | Low               |
| 2025-08-19 | `56343c942` | lucas picollo      | `getVotingDelay()` fetched from chain instead of DB                                                                                                    | Moved votingDelay from DB read to `eth_call`                | Low (cached)      |
| 2025-10-09 | `8948de00a` | lucas picollo      | `ProposalsService` + `ProposalsActivityService` calling `getProposalStatus()` per proposal in loops                                                    | Service-level per-proposal RPC loop                         | **CRITICAL**      |
| 2025-10-31 | `692e563d0` | Leonardo Vieira    | Controller calls `getQuorum()` per proposal + `getVotingDelay()` (the **duplicate** quorum fetch)                                                      | Doubled quorum `eth_call` count per request                 | **CRITICAL**      |
| 2025-10-31 | `154028d29` | Leonardo Vieira    | `getVotingPeriod()` added to proposals-activity flow                                                                                                   | +1 cached `eth_call` per activity request                   | Low               |
| 2025-12-08 | `1cbd5e0b3` | lucas picollo      | `getVotingDelay()` added to proposals-activity flow                                                                                                    | +1 cached `eth_call` per activity request                   | Low               |
| 2026-01-21 | `773d2e19f` | Alexandro T. Netto | Address-enrichment service with `isContract()` → `eth_getCode`                                                                                         | Fallback RPC for new addresses only                         | Low               |
| 2026-01-29 | `b7f1ec17f` | lucas picollo      | API decoupled from indexer — all DAO clients (UNI, OP, NOUNS, COMP, etc.) moved to `apps/api/src/clients/` **without adding caching to `getQuorum()`** | Uncached quorum persisted across refactor                   | **CRITICAL**      |
| 2026-02-06 | `06a1075a0` | lucas picollo      | Cached `votingDelay`, `proposalThreshold`, `votingPeriod` in `GovernorBase`                                                                            | Reduced 3 `eth_call`s to one-time                           | **FIX** (partial) |
| 2026-02-06 | `44008b4d4` | lucas picollo      | Moved `getCurrentBlockNumber` and `getBlockTime` to `GovernorBase` — still called **per proposal** with no caching                                     | Centralized but still uncached per-proposal                 | Neutral           |
| 2026-02-06 | `9cf8b14aa` | lucas picollo      | Added `getBlockTime()` + `getTimelockDelay()` to `getProposalStatus()` for pending execution detection                                                 | +2 RPC calls per status check (timelock cached after first) | Medium            |

### Key Observations

1. **The original sin (Jul 2025)**: The DAO client pattern was created with `readContract` for quorum and status — but never cached `getQuorum()` for most DAOs. This has been the case since the very beginning.

2. **The multiplier (Oct 2025)**: The service layer started calling `getProposalStatus()` in a loop per proposal (`8948de00a`), and then a week later the controller added a **second** per-proposal `getQuorum()` loop (`692e563d0`). This doubled the already-uncached quorum calls.

3. **The big refactor missed caching (Jan 2026)**: When the API was decoupled from the indexer (`b7f1ec17f`), all DAO clients were copied to `apps/api/src/clients/` without addressing the missing quorum cache.

4. **Partial fix (Feb 2026)**: `06a1075a0` added caching for `votingDelay`, `proposalThreshold`, and `votingPeriod` in `GovernorBase` — but `getQuorum()` and `getCurrentBlockNumber()`/`getBlockTime()` were left uncached.

---

## Executive Summary

The **API service** (`apps/api`) is the primary source of `eth_call` RPC spend. The main problem is **uncached `readContract` calls that multiply per proposal, per request**. The `GET /proposals` and `GET /proposals-activity` endpoints are the biggest offenders — each API request can trigger **dozens of `eth_call` RPCs** because quorum, status, and block data are fetched on-chain for every proposal in the result set, and most DAO clients do not cache these values.

| Component                                          | eth_call Sources                                                    | Severity     |
| -------------------------------------------------- | ------------------------------------------------------------------- | ------------ |
| **API** (`apps/api`)                               | `readContract` in governor clients, called per-proposal per-request | **CRITICAL** |
| **Indexer** (`apps/indexer`)                       | None (uses `eth_getLogs` only)                                      | None         |
| **Dashboard** (`apps/dashboard`)                   | Dead code only (`bulkGetEnsName` unused)                            | None         |
| **API Gateway** (`apps/api-gateway`)               | None (HTTP proxy only)                                              | None         |
| **Address Enrichment** (`apps/address-enrichment`) | `eth_getCode` fallback (not `eth_call`)                             | Low          |

---

## Detailed Findings

### 1. `apps/api` — CRITICAL

Each DAO runs its own API instance. All RPC calls below happen **per DAO instance**.

#### 1.1 The Request Flow That Multiplies RPC Calls

```
GET /proposals?limit=10
  └─ ProposalsService.getProposals()
       └─ FOR EACH proposal (10x):
            └─ daoClient.getProposalStatus(proposal)  ← service layer
                 ├─ getCurrentBlockNumber()            → eth_blockNumber
                 ├─ getBlockTime(block)                → eth_getBlockByNumber
                 ├─ getTimelockDelay()                 → 2x eth_call (cached after first)
                 └─ getQuorum(proposalId)              → 1-2x eth_call (NOT cached for most DAOs)
  └─ Controller:
       ├─ Promise.all(proposals.map(p => client.getQuorum(p.id)))  ← AGAIN per proposal
       └─ client.getVotingDelay()                                   → 1x eth_call (cached)
```

**For a single `GET /proposals?limit=10` request, the RPC call count is:**

| RPC Method                 | Source                                        | Count per request             |
| -------------------------- | --------------------------------------------- | ----------------------------- |
| `eth_blockNumber`          | `getProposalStatus` → `getCurrentBlockNumber` | 10                            |
| `eth_getBlockByNumber`     | `getProposalStatus` → `getBlockTime`          | 10                            |
| `eth_call` (quorum)        | `getProposalStatus` → `getQuorum` (service)   | 10 (uncached for most DAOs)   |
| `eth_call` (quorum)        | Controller → `getQuorum` (controller)         | 10 (uncached, duplicate!)     |
| `eth_call` (timelockDelay) | `getProposalStatus` → `getTimelockDelay`      | 2 (cached after first)        |
| `eth_call` (votingDelay)   | Controller → `getVotingDelay`                 | 1 (cached)                    |
| **TOTAL**                  |                                               | **~43 RPC calls per request** |

#### 1.2 Quorum Caching Breakdown by DAO — The Core Issue

The `getQuorum()` method is the main leak. Here's the caching status for each DAO client:

| DAO       | File                           | Caches `getQuorum`?      | eth_calls per `getQuorum()` invocation                        | Notes                                 |
| --------- | ------------------------------ | ------------------------ | ------------------------------------------------------------- | ------------------------------------- |
| **ENS**   | `clients/ens/index.ts:31-43`   | **Yes** (instance cache) | 0 after first (2 on first: `getBlockNumber` + `readContract`) | Only DAO that caches properly         |
| **UNI**   | `clients/uni/index.ts:31-38`   | **No**                   | **1** (`quorumVotes`)                                         | Fresh `readContract` every time       |
| **OP**    | `clients/op/index.ts:31-39`    | **No**                   | **1** (`quorum(proposalId)`)                                  | Per-proposal arg makes caching harder |
| **NOUNS** | `clients/nouns/index.ts:31-44` | **No**                   | **2** (`proposalCount` + `quorumVotes`)                       | Worst per-call cost                   |
| **COMP**  | `clients/comp/index.ts:31-39`  | **No**                   | **2** (`getBlockNumber` + `quorum(block)`)                    | Similar to ENS but no cache           |
| **GTC**   | `clients/gtc/index.ts`         | **No**                   | 2                                                             | Same pattern as COMP                  |
| **OBOL**  | `clients/obol/index.ts`        | **No**                   | 2                                                             | Same pattern as COMP                  |
| **ZK**    | `clients/zk/index.ts`          | **No**                   | 1                                                             | Similar to UNI                        |
| **SCR**   | `clients/scr/index.ts`         | N/A (hardcoded quorum)   | 0                                                             | Only DAO with zero quorum RPC         |

#### 1.3 Double Quorum Fetch — Controller + Service

`getQuorum()` is called **twice per proposal** in the `/proposals` flow:

1. **Service** (`services/proposals/index.ts:97`): `getProposalStatus()` calls `getQuorum()` internally (line 137 of `governor.base.ts`)
2. **Controller** (`controllers/proposals/proposals.ts:63`): `Promise.all(result.map(p => client.getQuorum(p.id)))` calls it again

This means the uncached quorum call happens 2x per proposal per request.

#### 1.4 Affected Endpoints

| Endpoint                            | eth_call per request            | Frequency                   | Impact             |
| ----------------------------------- | ------------------------------- | --------------------------- | ------------------ |
| `GET /proposals?limit=N`            | ~4N + 3 (varies by DAO)         | Every page load, every user | **CRITICAL**       |
| `GET /proposals/{id}`               | ~6-8                            | Per proposal detail view    | **HIGH**           |
| `GET /proposals-activity?address=X` | ~4N + 2 (N = proposals in page) | Per delegate profile view   | **HIGH**           |
| `GET /dao`                          | 5-7 on cache miss, 0 on hit     | Once per hour per DAO       | **LOW** (1h cache) |

#### 1.5 GovernorBase — Shared eth_call Sources

**File**: `apps/api/src/clients/governor.base.ts`

| Method                    | Lines   | RPC Type               | Cached?        | Called From                            |
| ------------------------- | ------- | ---------------------- | -------------- | -------------------------------------- |
| `getProposalThreshold()`  | 39-49   | `eth_call`             | Yes (instance) | `GET /dao`                             |
| `getVotingDelay()`        | 51-61   | `eth_call`             | Yes (instance) | Controllers, services                  |
| `getVotingPeriod()`       | 63-73   | `eth_call`             | Yes (instance) | `GET /proposals-activity`              |
| `getCurrentBlockNumber()` | 153-158 | `eth_blockNumber`      | **No**         | `getProposalStatus()` per proposal     |
| `getBlockTime()`          | 160-166 | `eth_getBlockByNumber` | **No**         | `getProposalStatus()` per proposal     |
| `getProposalStatus()`     | 85-151  | Orchestrator           | N/A            | Per proposal in all proposal endpoints |

#### 1.6 DaoService Cache

**File**: `apps/api/src/cache/dao-cache.ts`

The `GET /dao` endpoint has a 1-hour in-memory TTL cache. This is the **only endpoint-level cache** in the API. All proposal endpoints have zero result caching — every request goes to the chain.

#### 1.7 Multiplier: Number of DAO Instances

Each DAO runs its own API process. With 10 DAOs (ENS, UNI, OP, NOUNS, COMP, GTC, OBOL, ZK, SCR, ARB), the total RPC cost is multiplied by the number of active instances receiving traffic.

---

### 2. `apps/indexer` — NO eth_call

The Ponder indexer does **not** make `eth_call` RPCs. It uses:

- `eth_getLogs` for event indexing
- `eth_getBlockByNumber` for block metadata
- No `context.client.readContract()` usage in any handler

All data is extracted from event args (`event.args`) and block data (`event.block`), or read from the database (`context.db`).

---

### 3. `apps/dashboard` — NEGLIGIBLE

- **`shared/services/wallet/wallet.ts`**: Creates a `publicClient` with `batch: { multicall: true }` via Alchemy RPC, but it's only used for `bulkGetEnsName` which is **dead code** (exported but never imported).
- **`features/governance/utils/voteOnProposal.ts`**: Uses `simulateContract` (1 `eth_call`) only when a user actively votes — on-demand, low frequency.
- **wagmi config**: Standard wallet connection RPCs (chain detection, etc.) — minimal and unavoidable.

---

### 4. `apps/address-enrichment` — LOW

- **`src/utils/address-type.ts`**: `isContract()` uses `client.getCode()` → `eth_getCode` (not `eth_call`)
- **Triggered only as fallback**: When Arkham API doesn't have contract info for an address
- **`src/services/enrichment.ts:112`**: Called once per new address, result is persisted to DB
- **`src/scripts/sync-top-addresses.ts`**: CLI script with 100ms delay between addresses, only processes new addresses

---

### 5. `apps/api-gateway` — NONE

Pure GraphQL proxy over HTTP. Zero blockchain interaction.

---

## RPC Cost Estimation Model

Assuming a single DAO API instance receives **R** requests per hour to proposal endpoints:

```
eth_call per hour ≈ R × avg_proposals_per_page × calls_per_proposal

For UNI/OP/ZK (1 uncached quorum call × 2 places):
  ≈ R × 10 × 2 = 20R eth_calls

For NOUNS/COMP/GTC/OBOL (2 uncached quorum calls × 2 places):
  ≈ R × 10 × 4 = 40R eth_calls

Plus per-proposal: eth_blockNumber (10R) + eth_getBlockByNumber (10R)
```

**Example**: If each of 10 DAO APIs receives 60 requests/hour to `/proposals`:

- Conservative: `10 DAOs × 60 req × 20 eth_calls = 12,000 eth_calls/hour`
- With NOUNS/COMP: could reach `10 × 60 × 40 = 24,000 eth_calls/hour`
- Plus `eth_blockNumber` and `eth_getBlockByNumber`: another `10 × 60 × 20 = 12,000 RPCs/hour`

**Total: ~24,000–36,000+ RPC calls per hour** just from proposal endpoints.

---

## Root Cause Summary

| #   | Root Cause                                                                                    | Location                                         | Fix Complexity |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------- |
| 1   | **Quorum fetched per-proposal with no cache**                                                 | All DAO clients except ENS                       | Medium         |
| 2   | **Quorum fetched twice** (service + controller)                                               | `ProposalsService` + `proposals` controller      | Low            |
| 3   | **Block number/time fetched per-proposal**                                                    | `GovernorBase.getProposalStatus()`               | Low            |
| 4   | **No TTL cache on proposal status**                                                           | `ProposalsService`, `ProposalsActivityService`   | Medium         |
| 5   | **Timelock delay fetched per-status-check** (cached after first, but no TTL expiry awareness) | `GovernorBase.getProposalStatus()` → DAO clients | Low            |

---

## Recommendations (Ordered by Impact)

1. **Cache `getQuorum()` in all DAO clients** — Most impactful fix. Add instance-level caching like ENS does. For OP (per-proposal quorum), cache by proposalId with a short TTL.

2. **Remove duplicate quorum fetch** — The controller calls `getQuorum()` per proposal AND the service already calls it inside `getProposalStatus()`. The quorum value should be returned from the status check or cached so the controller doesn't re-fetch.

3. **Batch/cache `getCurrentBlockNumber()` and `getBlockTime()`** — These are called once per proposal inside `getProposalStatus()`. The block number and timestamp don't change within a single request — fetch once and reuse.

4. **Add response-level caching** — Proposal statuses only change when blocks advance. A short TTL (30s–2min) on the full proposal response would dramatically reduce RPC calls.

5. **Consider computing proposal status from indexed data** — Block numbers and timestamps are available in the database. The quorum and governance params could be indexed and stored, eliminating runtime RPC calls entirely.
