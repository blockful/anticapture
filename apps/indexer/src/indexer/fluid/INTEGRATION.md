# Fluid (INST/FLUID) Integration Status

## Architecture

| Contract | Address                                    | Type                                                               | Events used                                                                                     |
| -------- | ------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Token    | 0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb | ERC20 with delegation (ERC20Votes)                                 | Transfer, DelegateChanged, DelegateVotesChanged                                                 |
| Governor | 0x0204Cd037B2ec03605CFdFe482D8e257C765fA1B | CompoundGovernor (OZ-based, via InstaGovernorBravoDelegator proxy) | ProposalCreated, ProposalCanceled, ProposalQueued, ProposalExecuted, ProposalExtended, VoteCast |
| Timelock | 0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC | InstaTimelock (~2 day delay)                                       | (not indexed)                                                                                   |

Governor voting token: `0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb` (same as the ERC20 token)

Chain: Ethereum mainnet (chain ID 1, 12s block time)

## What's Integrated

- [x] Token supply tracking (Transfer events)
- [x] Delegation tracking (DelegateChanged / DelegateVotesChanged)
- [x] Voting power tracking (accountPower, votingPowerHistory)
- [x] Governor proposals (ProposalCreated, status updates)
- [x] Governor votes (VoteCast)
- [x] CEX/DEX/Lending address classification
- [x] Treasury tracking

## Address Classifications

### Treasury (4 addresses)

- `0x28849D2b63fA8D361e5fc15cB8aBB13019884d09` — InstaDApp Treasury (21.4M FLUID)
- `0x52Aa899454998Be5b000Ad077a46Bbe360F4e497` — Fluid Liquidity core contract (2.6M FLUID)
- `0x639f35C5E212D61Fe14Bd5CD8b66aAe4df11a50c` — Chainlink CCIP LockReleaseTokenPool (3.0M FLUID)
- `0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC` — InstaTimelock

### CEX (3 addresses)

- `0x9642b23Ed1E01Df1092B92641051881a322F5D4E` — MEXC
- `0x0D0707963952f2fBA59dD06f2b425ace40b492Fe` — Gate.io
- `0xaB782bc7D4a2b306825de5a7730034F8F63ee1bC` — Bitvavo

### DEX (1 address)

- `0xc1cd3D0913f4633b43FcdDBCd7342bC9b71C676f` — Uniswap V3 INST/WETH Pool

### Lending

None found — FLUID does not have active lending markets on major protocols.

## Verification (2026-03-20)

Indexed against local reth node, verified against on-chain data:

| Metric             | Indexed          | On-chain                       | Match |
| ------------------ | ---------------- | ------------------------------ | ----- |
| Proposals          | 125              | 125 (proposalCount())          | YES   |
| Top holder balance | 21,467,456 FLUID | 21,467,456 FLUID (balanceOf()) | YES   |
| 2nd holder balance | 5,808,211 FLUID  | 5,808,211 FLUID (balanceOf())  | YES   |
| Total accounts     | 39,771           | —                              | —     |
| Total transfers    | 509,175          | —                              | —     |
| Total votes        | 1,773            | —                              | —     |

## What's Pending

- API client (FLUIDClient) not yet created
- Dashboard DAO config not yet created
- Gateway env var (DAO_API_FLUID) not yet configured

## Notes

- Fluid was formerly known as Instadapp (INST token). The governor and
  token contracts use the INST-era naming internally but the DAO now
  brands as Fluid.
- The governor is a CompoundGovernor implementation identical to COMP —
  ABIs are copied directly from the COMP indexer.
- Many top holders use Instadapp Avocado smart account proxies, which
  are user wallets (not protocol infrastructure).
- The Chainlink CCIP LockReleaseTokenPool locks FLUID on mainnet for
  cross-chain bridging. Classified as Treasury since these tokens are
  effectively out of circulation.
