# Circulating Supply Audit Findings

**Date**: 2026-03-18
**Branch**: `fix/circulating-supply`
**Scope**: Indexer, API, Dashboard - circulating supply formula and address completeness

## Formula

```
circulatingSupply = totalSupply - treasury
```

The formula itself is correct and standard. The issue is that several DAOs have **empty or incomplete** address lists, causing treasury=0 and thus `circulatingSupply == totalSupply` (100% circulating), which is incorrect.

---

## Critical Issues

### 1. Empty Treasury Addresses (ARB, OP, AAVE)

Three DAOs have `TreasuryAddresses: {}`, meaning their treasury is always 0 and circulating supply equals total supply.

**ARB** - Total supply 10B ARB, circulating shown as 10B (should be ~5.3B per CoinGecko)

- Missing: DAO Treasury (`0xF3FC178157fb3c87548bAA86F9d24BA38E649B58`) - holds ~3.16B ARB
- Missing: L2 Treasury Timelock (`0xbFc1FECa8B09A5c5D3EFfE7429eBE24b9c09EF58`)
- Missing: L2 Core Timelock (`0x34d45e99f7D8c45ed05B5cA72D54bbD1fb3F98f0`)
- Missing: Foundation Vesting Wallet (`0x15533b77981cDa0F85c4F9a485237DF4285D6844`) - holds ~459.6M ARB
- Source: [Arbitrum docs](https://docs.arbitrum.foundation/deployment-addresses)

**OP** - Treasury shown as 0, circulating = total supply

- Missing: Unallocated Treasury (`0x2A82Ae142b2e62Cb7D10b55E323ACB1Cab663a26`)
- Missing: Foundation Budget (`0x2501c477D0A35545a387Aa4A3EEe4292A9a8B3F0`)
- Missing: Foundation Grants (`0x19793c7824Be70ec58BB673CA42D2779d12581BE`)
- Missing: Foundation Locked Grants (`0xE4553b743E74dA3424Ac51f8C1E586fd43aE226F`)
- Source: [Optimism governance forum](https://gov.optimism.io/t/where-are-the-optimisms-main-treasury-addresses/8880)

**AAVE** - No supply metrics tracked at all (see issue #3)

- Missing: Collector/Treasury (`0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c`)
- Missing: Ecosystem Reserve (`0x25F2226B597E8F9514B3F68F00f494cF4f286491`)
- Source: [Aave address book](https://github.com/bgd-labs/aave-address-book)

### 2. BurningAddresses - Dead Address Set to Zero Address

For 6 DAOs, the `Dead` address is set to `"0x0000000000000000000000000000000000000000"` (zero address) instead of the actual dead address `"0x000000000000000000000000000000000000dEaD"`.

**Affected DAOs**: GTC, NOUNS, SCR, COMP, OBOL, ZK

**Impact**:

- The "Dead" entry is redundant with `ZeroAddress` (both point to `0x000...000`)
- Any tokens sent to the actual dead address (`0x...dEaD`) are NOT counted as burns
- `totalSupply` is over-reported for these DAOs (not reduced by dead-address burns)
- This cascades into an over-reported `circulatingSupply`

**Correct DAOs** (already using `0x...dEaD`): UNI, ENS, SHU

### 3. AAVE Indexer Does NOT Track Supply Metrics

The AAVE transfer handler (`aaveTransfer()` in `apps/indexer/src/indexer/aave/shared.ts`) does NOT call:

- `updateSupplyMetric()` - no treasury/cex/dex/lending tracking
- `updateTotalSupply()` - no total supply tracking from burns/mints
- `updateCirculatingSupply()` - no circulating supply recalculation

All supply fields (totalSupply, circulatingSupply, treasury, cexSupply, dexSupply, lendingSupply) remain at their initial value of **0n**. This is because AAVE uses a custom transfer handler that only tracks balances, delegations, and feed events.

Additionally, the `aave` postgres database on local was found to contain **SHU (Shutter) data** instead of AAVE data, suggesting a misconfiguration.

**Note**: AAVE's architecture is fundamentally different - it tracks 3 token contracts (AAVE, stkAAVE, aAAVE) with combined voting power. Adding supply tracking requires architectural consideration beyond simple address list updates.

---

## Data Inconsistencies Found in Postgres

| Database   | Issue                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `uniswap`  | Data stale - latest bucket from **2020-09-27** (6 years old)                                                    |
| `gitcoin`  | Data stale - latest bucket from **2022-02-16** (4 years old)                                                    |
| `arbitrum` | Only 2 bucket rows total. All supply breakdown metrics = 0. Empty address lists for treasury, CEX, DEX, lending |
| `aave`     | Contains **SHU data** instead of AAVE. Token name = "SHU", address = SHU token address                          |
| `ens`      | Data current through 2026-01-23. Formula passes                                                                 |
| `shutter`  | Data current through 2026-03-16. Formula passes                                                                 |

## Supply Values in Postgres (at time of audit)

| DAO  | Total Supply   | Circulating    | Treasury    | Formula OK?                        |
| ---- | -------------- | -------------- | ----------- | ---------------------------------- |
| UNI  | 968,334,161    | 538,334,161    | 430,000,000 | Yes                                |
| ENS  | 99,999,995     | 90,298,940     | 9,701,055   | Yes                                |
| SHU  | 1,000,000,000  | 449,262,882    | 550,737,117 | Yes                                |
| GTC  | 99,990,931     | 94,747,685     | 5,243,245   | Yes                                |
| ARB  | 10,000,000,000 | 10,000,000,000 | 0           | Yes (but treasury SHOULD NOT be 0) |
| AAVE | 0              | 0              | 0           | N/A (no tracking)                  |

---

## Fixes Applied

### Fix 1: Add treasury addresses for ARB, OP, AAVE

- File: `apps/indexer/src/lib/constants.ts`
- Added verified treasury addresses from official documentation

### Fix 2: Fix BurningAddresses dead address for GTC, NOUNS, SCR, COMP, OBOL, ZK

- File: `apps/indexer/src/lib/constants.ts`
- Changed `Dead` from `"0x0000000000000000000000000000000000000000"` to `"0x000000000000000000000000000000000000dEaD"`

### Fix 3: AAVE supply tracking (NOT applied - requires discussion)

- The AAVE indexer's architecture is fundamentally different
- Adding supply metrics requires refactoring `aaveTransfer()` to call the supply update functions
- This needs coordination with the team to ensure correctness across the 3 AAVE token types
- Recommend as a separate PR

---

## On-Chain Verification (block 24682058)

Treasury address balances verified via local reth node:

| Address         | Description            | Balance       |
| --------------- | ---------------------- | ------------- |
| `0x464C71f6...` | AAVE Collector         | ~18,225 AAVE  |
| `0x25F2226B...` | AAVE Ecosystem Reserve | ~321,590 AAVE |

Dead address (0x...dEaD) burn verification:

| Token | Balance at 0x...dEaD | Significance           |
| ----- | -------------------- | ---------------------- |
| UNI   | ~102M UNI            | Large intentional burn |
| GTC   | ~2.63 GTC            | Negligible             |
| COMP  | ~0.113 COMP          | Negligible             |

Note: While GTC and COMP dead address balances are negligible today, the fix is still correct — the dead address should be properly configured to capture any future burns.

---

## Recommendations

1. **Reindex ARB and OP** after treasury address additions to get accurate circulating supply
2. **Investigate stale databases** (UNI, GTC) - these may need reindexing
3. **Fix AAVE indexer** in a separate PR to add supply metric tracking
4. **Add CEX/DEX/Lending addresses for ARB** - currently all empty, no supply breakdown available
5. **Regularly audit address lists** against on-chain data as DAOs deploy new contracts
