# GNO Integration Status

## Architecture

| Contract | Address | Type                            | Events used                                                                   |
| -------- | ------- | ------------------------------- | ----------------------------------------------------------------------------- |
| Token    | TODO    | ERC20 (unverified)              | Transfer, DelegateChanged, DelegateVotesChanged                               |
| Governor | TODO    | OZ Governor (unverified)        | ProposalCreated, VoteCast, ProposalQueued, ProposalExecuted, ProposalCanceled |
| Timelock | TODO    | TimelockController (unverified) | (not indexed)                                                                 |

Governor voting token: TODO — run `cast call <GOVERNOR> "token()(address)"` to verify

## What's Integrated

- [ ] Token supply tracking (Transfer events)
- [ ] Delegation tracking (DelegateChanged / DelegateVotesChanged)
- [ ] Voting power tracking (accountPower, votingPowerHistory)
- [ ] Governor proposals (ProposalCreated, status updates)
- [ ] Governor votes (VoteCast)
- [ ] CEX/DEX/Lending address classification
- [ ] Treasury tracking

## What's Pending

- Fill in actual contract addresses in `apps/indexer/src/lib/constants.ts` and `apps/api/src/lib/constants.ts`
- Run Step 0 (Governance Architecture Discovery) from the DAO Integration skill:
  - Call `governor.token()` to confirm the voting token
  - Check whether delegation is via standard ERC20Votes or a veToken wrapper
- Replace stub ABIs in `abi/token.ts` and `abi/governor.ts` with the real ones from block explorer
- Add known CEX/DEX/Lending/Treasury addresses to the address tables in constants
- Add GNO icon and OG icon components to the dashboard
- Fill in governance rules (quorum calculation, voting delay, voting period, proposal threshold) in `apps/dashboard/shared/dao-config/gno.ts`
- Verify `calculateQuorum` logic in `apps/api/src/clients/gno/index.ts` matches actual governance rules

## Notes

- Scaffolded assuming standard ERC20Votes + OZ Governor — must be verified on-chain before running the indexer
- Do NOT run the indexer until contract addresses and ABIs are confirmed
