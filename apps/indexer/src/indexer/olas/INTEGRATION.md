# Olas (OLAS) Integration Status

## Architecture

| Contract      | Address                                      | Type                                            | Events used                                                                   |
| ------------- | -------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| OLAS Token    | `0x0001A500A6B18995B03f44bb040A5fFc28E45CB0` | Plain ERC20 (no delegation)                     | Transfer                                                                      |
| veOLAS        | `0x7e01A500805f8A52Fad229b3015AD130A332B7b3` | Vote-escrow (Curve-style)                       | **Not indexed** — emits Deposit, Withdraw, Supply                             |
| wveOLAS       | `0x4039B809E0C0Ad04F6Fc880193366b251dDf4B40` | Read-only wrapper for veOLAS                    | Not indexed                                                                   |
| Governor OLAS | `0x8E84B5055492901988B831817e4Ace5275A3b401` | OZ Governor v4.8.3 + GovernorCompatibilityBravo | ProposalCreated, VoteCast, ProposalCanceled, ProposalExecuted, ProposalQueued |
| Timelock      | `0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE` | TimelockController                              | Not indexed (registered as treasury)                                          |

Governor voting token: `0x4039B809E0C0Ad04F6Fc880193366b251dDf4B40` (wveOLAS — a wrapper around veOLAS, **not** the ERC20 token).

Governance power is earned by locking OLAS tokens in veOLAS for up to 4 years. Voting power decays linearly over the lock period. There is no delegation — each user's voting power is determined solely by their lock amount and remaining lock time.

## What's Integrated

- [x] Token supply tracking (Transfer events on OLAS ERC20)
- [ ] Delegation tracking — **N/A**: OLAS ERC20 has no DelegateChanged/DelegateVotesChanged
- [ ] Voting power tracking (accountPower, votingPowerHistory) — requires veOLAS indexing
- [x] Governor proposals (ProposalCreated, status updates)
- [x] Governor votes (VoteCast)
- [ ] CEX/DEX/Lending address classification — no addresses provided yet
- [x] Treasury tracking (timelock address registered)

## What's Pending

### 1. veOLAS indexing (high priority)

The core governance mechanism — who has voting power and how much — is not tracked. veOLAS emits:

- `Deposit(address provider, uint256 amount, uint256 locktime, uint256 depositType, uint256 ts)` — user locks OLAS
- `Withdraw(address provider, uint256 amount, uint256 ts)` — user unlocks after expiry
- `Supply(uint256 prevSupply, uint256 supply)` — total locked supply changes

To integrate:

- Add veOLAS ABI and contract to `olas.config.ts`
- Write custom event handlers mapping Deposit/Withdraw to `accountPower` and `votingPowerHistory`
- Map total locked supply (from `Supply` events) to `delegatedSupply` on the token record
- This is a new pattern not used by any other DAO — requires custom handler logic

### 2. CEX/DEX/Lending addresses

User stated no CEX or DEX addresses available yet. When provided, add to `CEXAddresses[DaoIdEnum.OLAS]`, `DEXAddresses[DaoIdEnum.OLAS]`, and `LendingAddresses[DaoIdEnum.OLAS]` in constants.ts.

### 3. API, Gateway, Dashboard integration

Only the indexer component is complete. Steps 3–5 from the dao-integration skill remain.

## Notes

- The user provided `0x7e01A500805f8A52Fad229b3015AD130A332B7b3` (veOLAS) as the "token" address. veOLAS is non-transferable and doesn't emit Transfer events. The actual tradeable OLAS ERC20 is at `0x0001A500A6B18995B03f44bb040A5fFc28E45CB0` — this is what we index for supply metrics.
- Governor uses OZ v4.8.3 naming convention: ProposalCreated uses `startBlock`/`endBlock` (not `voteStart`/`voteEnd` like OZ v5).
- `delegatedSupply` will remain 0 until veOLAS indexing is implemented. This is expected — it does not indicate a bug.
