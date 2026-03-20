# TrueFi Integration Status

## Architecture

| Contract       | Address                                    | Type                                                | Events used                                                                                       |
| -------------- | ------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Token (stkTRU) | 0x23696914Ca9737466D8553a2d619948f548Ee424 | ERC20 proxy w/ delegation (8 decimals)              | Transfer, DelegateChanged, DelegateVotesChanged                                                   |
| Governor       | 0x585CcA060422ef1779Fb0Dd710A49e7C49A823C9 | OZ Governor v1 (`support=bravo&quorum=for,abstain`) | ProposalCreated, VoteCast, VoteCastWithParams, ProposalQueued, ProposalExecuted, ProposalCanceled |
| Timelock       | 0x4f4AC7a7032A14243aEbDa98Ee04a5D7Fe293d07 | OZ TimelockController (2-day delay)                 | (not indexed directly)                                                                            |

Governor voting token: `0x23696914Ca9737466D8553a2d619948f548Ee424` (stkTRU — staking wrapper, **not** the underlying TRU token)

Underlying TRU token: `0x4C19596f5aAfF459fA38B0f7eD92F11AE6543784` (ERC20, 8 decimals, ~1.45B total supply)

## What's Integrated

- [x] Token supply tracking (Transfer events on stkTRU)
- [x] Delegation tracking (DelegateChanged / DelegateVotesChanged)
- [x] Voting power tracking (accountPower, votingPowerHistory)
- [x] Governor proposals (ProposalCreated, status updates)
- [x] Governor votes (VoteCast, VoteCastWithParams)
- [ ] CEX/DEX/Lending address classification (no addresses provided)
- [x] Treasury tracking (timelock address configured)
- [x] API client with computed proposal statuses (DEFEATED, SUCCEEDED, NO_QUORUM, etc.)

## What's Pending

### TRU token indexing (token distribution analytics)

The governor uses stkTRU (staking wrapper) for voting, but the underlying TRU token is the tradeable asset listed on exchanges. Currently we only index stkTRU, which means:

- **Circulating supply** reflects only staked supply (~38M stkTRU) rather than total TRU supply (~1.45B). Only ~2.4% of TRU is staked.
- **CEX/DEX/Lending tracking** should be on TRU, not stkTRU — TRU is what's traded on exchanges and used in DeFi.
- **Token distribution** metrics are incomplete without TRU.

To close this gap, add TRU (`0x4C19596f5aAfF459fA38B0f7eD92F11AE6543784`) as a second indexed token, similar to the AAVE multi-token pattern (AAVE + stkAAVE + aAAVE). The governance (proposals, votes, delegation) would remain on stkTRU.

### CEX/DEX/Lending addresses

No exchange or DeFi addresses were provided. These should be researched and added for TRU (the tradeable token) once TRU indexing is implemented.

### Dashboard configuration

Dashboard DAO config (`apps/dashboard/shared/dao-config/truefi.ts`) has not been created yet. Needed for the frontend to display TrueFi.

## Notes

- stkTRU is a proxy contract (impl: `0xBFE206c8eCd49751Bf7c9C8C1331738FC29F084d`). Uses Compound-style delegation (`getCurrentVotes`/`getPriorVotes`) rather than OZ-style (`getVotes`/`getPastVotes`), but emits the same standard events.
- Governor COUNTING_MODE is `support=bravo&quorum=for,abstain` — quorum counts both For and Abstain votes.
- Deployment blocks: Token at 11,884,565 / Timelock at 14,789,709 / Governor at 14,789,712.
- 71 proposals indexed as of March 2026, latest being TFIP-41 (TrueFi Reconstitution and Transition to Brila).
