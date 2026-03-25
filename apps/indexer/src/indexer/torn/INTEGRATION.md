# Tornado Cash (TORN) Integration Status

## Architecture

| Contract              | Address                                    | Type                  | Events used                                                      |
| --------------------- | ------------------------------------------ | --------------------- | ---------------------------------------------------------------- |
| TORN Token            | 0x77777FeDdddFfC19Ff86DB637967013e6C6A116C | ERC20 (no delegation) | Transfer                                                         |
| Governance            | 0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce | Custom stake-to-vote  | ProposalCreated, Voted, ProposalExecuted, Delegated, Undelegated |
| TornadoStakingRewards | 0x5B3f656C80E8ddb9ec01Dd9018815576E9238c29 | Staking rewards       | (not indexed)                                                    |
| TornadoVault          | 0x2F50508a8a3D323B91336FA3eA6ae50E55f32185 | Vault                 | (not indexed)                                                    |

Governor voting token: Voting power comes from `lockedBalance` in the Governance contract, NOT from token-level delegation. Users lock TORN into the Governance contract to gain voting power.

## What's Integrated

- [x] Token supply tracking (Transfer events)
- [x] CEX/DEX/Lending/Treasury/NonCirculating supply classification
- [x] Circulating supply calculation
- [x] Delegated supply tracking (via lock/unlock detection — Transfer to/from Governance contract)
- [x] Governor-level delegation tracking (Delegated/Undelegated events)
- [x] Governor proposals (ProposalCreated — custom handler with timestamp-based timing)
- [x] Governor votes (Voted — binary for/against, no abstain)
- [x] Proposal execution (ProposalExecuted event)
- [x] API client with timestamp-based proposal status computation

## What's Pending

### No per-account votingPowerHistory

The standard pattern relies on `DelegateVotesChanged` events which TORN doesn't emit. Voting power = `lockedBalance` in the governor. We track aggregate `delegatedSupply` (total locked TORN) but individual `votingPowerHistory` records are not populated.

**To close this gap:** Detect Transfer events to/from the governance contract and create synthetic `votingPowerHistory` entries. Requires careful handling when delegation shifts occur (voting power moves between accounts without a Transfer).

### No abstain votes

Tornado Cash uses binary voting (`bool support`: true=for, false=against). The `abstainVotes` field on proposals will always be 0. Dashboard should ideally hide the abstain column for TORN.

### Vote extension mechanism not tracked

If a vote outcome flips during the last hour (CLOSING_PERIOD = 3600s), voting extends by 6 hours (VOTE_EXTEND_TIME = 21600s). Our indexer stores the initial `endTime` from `ProposalCreated`. The actual end time may differ for proposals where the extension triggered. This could cause brief status mismatches during the extension window. No on-chain event is emitted for the extension.

### No intermediate proposal state events

Tornado Cash does NOT emit events for state transitions between Pending, Active, Defeated, Timelocked, AwaitingExecution, and Expired. Only `ProposalCreated` and `ProposalExecuted` are emitted. All intermediate states are computed at the API level by `TORNClient.getProposalStatus()` using timestamp comparisons against governance parameters.

### Staking rewards not tracked

The `TornadoStakingRewards` contract (0x5B3f656C80E8ddb9ec01Dd9018815576E9238c29) distributes relayer fees to locked TORN holders. This economic dimension is not captured. It doesn't affect governance voting directly but represents additional yield for participants.

### Proposal target decoding

Proposals are deployed contracts executed via `delegatecall` from the Governance contract. We index the `target` address but cannot decode what the proposal does without reading the target contract's bytecode. `alreadySupportCalldataReview` is set to `false`.

### Cancel function

Tornado Cash proposals cannot be canceled once created. There is no `ProposalCanceled` event. The `cancelFunction` rule is set to `false`.

## Notes

### Custom governance architecture

Tornado Cash uses a LoopbackProxy (TransparentUpgradeableProxy where the proxy is its own admin). The governance contract has been upgraded multiple times; current version is `"5.proposal-state-patch"`.

Key architectural differences from standard OZ/Compound governors:

- **Stake-to-vote**: Lock TORN → get voting power (no token-level delegation)
- **Timestamp-based**: All timing parameters (VOTING_DELAY, VOTING_PERIOD, EXECUTION_DELAY, EXECUTION_EXPIRATION) are in seconds
- **Binary voting**: for/against only, no abstain
- **Built-in timelock**: No separate timelock contract
- **Proposal = contract**: Proposals are deployed contracts with `executeProposal()`, executed via `delegatecall`

### Governance attack (May 2023)

In May 2023, an attacker gained majority voting power via a malicious proposal (proposal #21) that granted them TORN tokens within the governance contract. The attack was later partially reversed. The indexed data accurately reflects this period, which may show unusual voting power concentration on the dashboard.

### OFAC sanctions

Tornado Cash was sanctioned by the U.S. Treasury's OFAC in August 2022. While the sanctions on the smart contracts were later vacated by a federal court ruling (November 2024), some RPC providers (Merkle) still block calls to Tornado Cash contracts. The indexer and API must use a non-censoring RPC provider.

### Governance parameters (on-chain values)

| Parameter            | Value  | Human-readable |
| -------------------- | ------ | -------------- |
| VOTING_DELAY         | 75     | 75 seconds     |
| VOTING_PERIOD        | 432000 | 5 days         |
| QUORUM_VOTES         | 1e23   | 100,000 TORN   |
| PROPOSAL_THRESHOLD   | 1e21   | 1,000 TORN     |
| EXECUTION_DELAY      | 172800 | 2 days         |
| EXECUTION_EXPIRATION | 259200 | 3 days         |
| CLOSING_PERIOD       | 3600   | 1 hour         |
| VOTE_EXTEND_TIME     | 21600  | 6 hours        |

### Vote handler: onConflictDoNothing

The shared `voteCast()` handler uses plain inserts which trigger Ponder's `DelayedInsertError` during batch flushing (duplicate key constraint on `votes_onchain`). This is specific to Tornado Cash and occurs during backfill. The custom handler uses `onConflictDoNothing` on the vote insert to prevent crashes, with incremental tally updates. After backfill, tallies should be reconciled from vote rows via SQL.

### Vote tallies vs on-chain proposals struct

Indexed vote tallies (from Voted events) may differ from on-chain `proposals(id).forVotes/againstVotes`. The governance contract was upgraded 5 times (current version: `"5.proposal-state-patch"`), including post-attack recovery proposals that may have directly modified the `proposals` mapping. Our indexed data reflects the immutable Voted event history. Both are valid — events show what happened, on-chain struct shows the current governance state.

### Verification results (March 2026)

Full backfill completed successfully with zero crashes.

| Metric             | Indexed      | On-chain     | Status          |
| ------------------ | ------------ | ------------ | --------------- |
| Proposals          | 65           | 65           | Exact match     |
| Executed proposals | 49           | 49           | Exact match     |
| Votes              | 1,089        | —            | Zero duplicates |
| delegatedSupply    | 4,732,271.91 | 4,732,271.91 | Exact match     |
| Delegations        | 72           | —            | —               |
| Transfers          | 458,282      | —            | —               |
| Accounts           | 42,890       | —            | —               |
