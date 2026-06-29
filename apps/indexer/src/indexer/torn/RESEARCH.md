# Tornado Cash (TORN) — Research, Anatomy & Next Steps

> Companion to `INTEGRATION.md`. Independent research delivery to support PR #2002.
> Source of truth: `tornadocash/tornado-governance` (verified impl `GovernanceProposalStateUpgrade`,
> on-chain version `"5.proposal-state-patch"`), Etherscan, and on-chain reads. Date: 2026-06-29.

## 0. Why now — the June 2026 attack

On **2026-06-25, Proposal 67** pointed execution at an **unverified look-alike contract**
(`0x5efda50f22d34f27…` vs the real governor `0x5efda50f22d34F26…` — differs only from the 16th
hex char) to swap governance control over a ~$23M TORN treasury. It drew **0 for / 27,163 against**
and is failing quorum (≈27% of the 100,000 TORN quorum), but it is the **second** attempt after the
May 2023 takeover. This is the motivation for the **proposal-target verification** work in §5.

---

## 1. Anatomy of the DAO

### 1.1 Contract topology

| Role | Address | Type | Indexed? |
|---|---|---|---|
| Governance (proxy) | `0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce` | `LoopbackProxy` → `GovernanceProposalStateUpgrade` | ✅ events |
| TORN token | `0x77777FeDdddFfC19Ff86DB637967013e6C6A116C` | ERC20 + permit (no checkpoints) | ✅ Transfer |
| TornadoVault | `0x2F50508a8a3D323B91336FA3eA6Ae50e55f32185` | holds locked TORN since v2 | ⚠️ balance only |
| Governance Staking | `0x2FC93484614a34f26F7970CBB94615bA109BB4bf` (proxy) | relayer-fee rewards | ❌ |
| Community Multisig | `0xb04E030140b30C27bcdfaafFFA98C57d80eDa7B4` | gas-comp only; cannot pass proposals | n/a |

### 1.2 What makes it NOT a Governor Bravo

| Dimension | Standard (Bravo/ERC20Votes) | Tornado Cash |
|---|---|---|
| Voting power | `DelegateVotesChanged` checkpoints | `lockedBalance` mapping, **no event** |
| Acquire power | hold + self-delegate | **lock** TORN into governor (→ Vault) |
| Delegation | additive weight transfer | **pointer**; power = Σ delegators' locked, used only via `castDelegatedVote` |
| Vote support | `0/1/2` for/against/abstain | **bool** for/against, **no abstain** |
| Proposal | `targets[]/values[]/calldatas[]` | **single `target`**, run via `delegatecall executeProposal()` |
| Lifecycle | Timelock contract + `Queued`/`Canceled` | timestamp-derived `state()`, **no queue/cancel events**, no cancel fn |
| Params | typically fixed | **mutable** via passed proposal |

### 1.3 On-chain parameters (live values — verify, they are mutable)

| Param | Live value | Notes |
|---|---|---|
| `QUORUM_VOTES` | **100,000 TORN** | raised from the 25,000 default |
| `PROPOSAL_THRESHOLD` | **1,000 TORN** | ⚠️ dashboard copy currently says 25,000 — see §6 |
| `VOTING_DELAY` | **75 s** | ⚠️ dashboard copy says ~1 block/12s — see §6 |
| `VOTING_PERIOD` | **432,000 s (5 d)** | (v1 default was 3 d) |
| `EXECUTION_DELAY` | 172,800 s (2 d) | built-in timelock |
| `EXECUTION_EXPIRATION` | 259,200 s (3 d) | execution window |
| `CLOSING_PERIOD` / `VOTE_EXTEND_TIME` | 3,600 s / 21,600 s | one-time 6h extension on late flip |

States: `Pending · Active · Defeated · Timelocked · AwaitingExecution · Executed · Expired` (no Canceled).
Quorum rule on-chain: **`forVotes + againstVotes >= QUORUM_VOTES` AND `forVotes > againstVotes`**.

### 1.4 Governance lifecycle & events

| Step | Function | Event(s) | topic0 |
|---|---|---|---|
| Lock (gain power) | `lockWithApproval` / `lock` | none (signal: TORN `Transfer`→Vault, `RewardUpdate*`) | — |
| Delegate | `delegate` / `undelegate` | `Delegated` / `Undelegated` | `0x4bc154…` / `0x1af5b1…` |
| Propose | `propose` / `proposeByDelegate` | `ProposalCreated` | `0x90ec05…` |
| Vote | `castVote` / `castDelegatedVote` | `Voted` (one per voter) | `0x7c2de5…` |
| Timelock | — (implicit) | none | — |
| Execute | `execute` | `ProposalExecuted` | `0x712ae1…` |
| Unlock | `unlock` | none (signal: TORN `Transfer`←Vault) | — |

---

## 2. Tech funnel (data → interface)

```
ETHEREUM
  Governance proxy  ──ProposalCreated / Voted / ProposalExecuted / Delegated / Undelegated──┐
  TORN token        ──Transfer───────────────────────────────────────────────────────────┐│
        │ (eth_call: QUORUM_VOTES, *_DELAY/PERIOD, EXECUTION_*)                            ││
        ▼                                                                                   ▼▼
[1] INDEXER  apps/indexer/src/indexer/torn/{governor,erc20}.ts
        • bool→0/1 support · single target→targets:[t] · timestamp→synthetic block
        • delegatedSupply from Transfers in/out of governor
        ▼  writes
[2] POSTGRES (Ponder schema)  proposalsOnchain · votesOnchain · accountPower · delegation · transfer · token
        ▲  Drizzle (direct read)
[3] API  apps/api  (Hono REST · controller→service→repository→mapper · clients/)
        • clients/torn/TORNClient extends GovernorBase  (live quorum, timestamp state machine)
        • eth_call for live params & status
        ▼  OpenAPI
[4] anticapture-client  (kubb → TanStack Query hooks)  →  gateful (gateway)
        ▼
[5] DASHBOARD  apps/dashboard  (Next.js, white-label via middleware + shared/dao-config/torn.ts)
        proposals · holders-and-delegates · attack-profitability · token-distribution · governance risk
```

**White-label:** already supported — `middleware.ts` resolves hostname→daoId; a custom domain only needs
`hostnames: [...]` in `torn.ts`. No platform work.

---

## 3. What PR #2002 already delivers (do not redo)

- [x] Token supply + CEX/DEX/Lending/Treasury/NonCirculating classification + circulating supply
- [x] `delegatedSupply` (aggregate locked TORN) via Transfer detection
- [x] Governor delegation (`Delegated`/`Undelegated` → `delegateChanged`)
- [x] Proposals (custom timestamp handler), votes (binary), execution
- [x] `TORNClient` with live `QUORUM_VOTES` + timestamp-based status
- [x] Dashboard config: attack-profitability, governance-implementation risk matrix, attack-exposure, holders/delegates, token distribution
- [x] Backfill verified (65 proposals, 49 executed, 1,089 votes — matches chain)

---

## 4. Open gaps (from INTEGRATION.md, confirmed)

1. **Per-account `votingPowerHistory` not populated** — only aggregate `delegatedSupply`. Holders/delegates
   voting-power-over-time is therefore incomplete.
2. **Vote extension not tracked** — `endTime` can shift +6h; indexer keeps initial `endTime`.
3. **Staking rewards not tracked** — relayer-fee yield on locked TORN (economic only).
4. **Proposal target not decoded** — `alreadySupportCalldataReview() = false`; target indexed but not analyzed.
5. **abstain column** — always 0; hide for TORN in UI.

---

## 5. Recommended next steps (priority order)

### P1 — Proposal-target verification (highest value; addresses Proposal 67)
The June 2026 attack was an **unverified look-alike target**. Add a detection signal:
- On `ProposalCreated`, enrich `target` via the existing **`apps/address-enrichment`** app:
  - Etherscan **source-verified?** (unverified ⇒ HIGH risk)
  - **address-similarity** vs a known-entity allowlist (governor/vault/token/multisig) — catches `…f27…` vs `…F26…`
  - optional: bytecode decompile diff (declared vs actual)
- Surface as a `target_risk` field on proposal detail + a `feedEvent` flag → red banner.
- Flip `alreadySupportCalldataReview()` accordingly once decode lands.

### P2 — Per-account voting power
- Use `RewardUpdateSuccessful(account)` (fires on every lock/unlock) as a "balance-changed" trigger to
  `readContract lockedBalance(account)` and write `votingPowerHistory` + `accountPower.votingPower`.
- Backfill via TORN `Transfer` to/from governor+Vault, reconciling delegation shifts.

### P3 — Correctness fixes (see §6)
- Re-vote handling, `calculateQuorum`, vote extension, config copy.

---

## 6. Findings to verify against the contract (correctness)

> Flagging for maintainer review; each is a small, contained fix.

1. **Re-votes are silently dropped.** Tornado `_castVote` **allows overwriting a vote** (it subtracts the old
   receipt and adds the new). The indexer uses `onConflictDoNothing` on PK `(voterAccountId, proposalId)`, so a
   changed vote is ignored — indexed tallies drift from chain (the "tallies may differ" note in INTEGRATION.md
   is partly this). **Fix:** on conflict, recompute the tally (subtract old `votingPower`/side, add new) like the contract.

2. **`calculateQuorum` returns `forVotes` only.** On-chain `state()` reaches quorum on
   **`forVotes + againstVotes >= QUORUM_VOTES`**. Returning `forVotes` can mislabel `NO_QUORUM`.
   **Fix:** `return votes.forVotes + votes.againstVotes;`

3. **`rules.changeVote: false` / `VOTE_MUTABILITY` "does not allow changing votes"** contradicts the source —
   re-voting is allowed while Active. **Fix:** set `changeVote: true` and update the risk copy (lowers that risk).

4. **`PROPOSAL_THRESHOLD` copy says "25,000 TORN"** — actual is **1,000 TORN** (`1e21`). Likely confused with the
   old 25,000 quorum. **Fix:** correct the dashboard string.

5. **`VOTING_DELAY` copy says "~1 block (~12s)"** — actual is **75 s**. Minor; align copy.

6. **Add the June 2026 (Proposal 67) attack** to INTEGRATION.md notes alongside May 2023 — it is the live
   motivation for P1.

---

## 7. Effort summary

| Item | Layer | Size |
|---|---|---|
| P1 target verification | address-enrichment + api + dashboard | M |
| P2 per-account voting power | indexer (readContract on RewardUpdate*) | M |
| Re-vote tally fix | indexer governor.ts | S |
| calculateQuorum fix | api clients/torn | XS |
| Config copy fixes (#3–#5) | dashboard torn.ts | XS |
| abstain column hide | dashboard | XS |
