# Tornado Cash DAO Integration Design

## Summary

Full integration of Tornado Cash DAO into the Anticapture platform — indexer, API, gateway, and dashboard. Tornado Cash uses a **custom stake-to-vote governance** (not OZ Governor or Compound GovernorBravo), which requires custom event handlers while mapping to the existing shared schema.

## Contracts

| Contract              | Address                                      | Deploy Block | Purpose                                |
| --------------------- | -------------------------------------------- | ------------ | -------------------------------------- |
| TORN Token            | `0x77777FeDdddFfC19Ff86DB637967013e6C6A116C` | 11,474,599   | ERC20 governance token (18 decimals)   |
| Governance            | `0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce` | 11,474,695   | Stake-to-vote governor (LoopbackProxy) |
| TornadoStakingRewards | `0x5B3f656C80E8ddb9ec01Dd9018815576E9238c29` | 17,546,145   | Relayer fee staking rewards            |
| TornadoVault          | `0x2F50508a8a3D323B91336FA3eA6ae50E55f32185` | 13,429,786   | TORN vault for governance withdrawals  |

## Governance Architecture

Tornado Cash does NOT use OpenZeppelin Governor or Compound GovernorAlpha/Bravo. Key differences:

1. **Stake-to-vote**: Users lock TORN into the Governance contract. `lockedBalance` = voting power. No token-level delegation.
2. **Governor-level delegation**: `Delegated`/`Undelegated` events are emitted by the Governance contract, not the token.
3. **No vote checkpointing**: Voting power is the current `lockedBalance` at time of vote — no snapshots.
4. **Built-in timelock**: No separate timelock contract. `EXECUTION_DELAY` (2 days) is baked into the governor.
5. **Binary voting**: `bool support` (for/against). No abstain option.
6. **Proposal = contract**: Proposals are deployed contracts with `executeProposal()`, executed via `delegatecall` from the governor.

### Governance Parameters

| Parameter            | Value        |
| -------------------- | ------------ |
| Voting Delay         | 75 seconds   |
| Voting Period        | 5 days       |
| Quorum               | 100,000 TORN |
| Proposal Threshold   | 1,000 TORN   |
| Execution Delay      | 2 days       |
| Execution Expiration | 3 days       |
| Closing Period       | 1 hour       |
| Vote Extend Time     | 6 hours      |

### Proposal States

| On-chain State    | Value | Maps to Anticapture |
| ----------------- | ----- | ------------------- |
| Pending           | 0     | PENDING             |
| Active            | 1     | ACTIVE              |
| Defeated          | 2     | DEFEATED            |
| Timelocked        | 3     | QUEUED              |
| AwaitingExecution | 4     | PENDING_EXECUTION   |
| Executed          | 5     | EXECUTED            |
| Expired           | 6     | EXPIRED             |

### Event Signatures (Governor)

```
ProposalCreated(uint256 indexed id, address indexed proposer, address target, uint256 startTime, uint256 endTime, string description)
Voted(uint256 indexed proposalId, address indexed voter, bool indexed support, uint256 votes)
ProposalExecuted(uint256 indexed proposalId)
Delegated(address indexed account, address indexed to)
Undelegated(address indexed account, address indexed from)
```

### Event Signatures (Token)

Standard ERC20: `Transfer(address indexed from, address indexed to, uint256 value)`

No `DelegateChanged` or `DelegateVotesChanged` — TORN does not have built-in delegation.

## Design

### Indexer — Token Handler (`erc20.ts`)

Handle `Transfer` events using the standard `tokenTransfer()` utility:

- Balance tracking for all accounts
- CEX/DEX/Lending/Treasury/NonCirculating supply classification
- Circulating supply calculation

**Lock tracking via Transfer**: When TORN is transferred to/from the Governance contract address (`0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce`):

- Transfer TO governor = lock (user locks TORN for voting power)
- Transfer FROM governor = unlock (user withdraws TORN)
- Use these to update `delegatedSupply` via `updateDelegatedSupply()` — locked TORN represents the total voting power pool

### Indexer — Governor Handler (`governor.ts`)

**`Voted` event** → mapped to `voteCast()`:

- `bool support` mapped to `uint8`: `true → 1` (for), `false → 0` (against)
- No abstain support (Tornado Cash doesn't have it)
- `votes` field provides the voting power used

**`ProposalCreated` event** → mapped to `proposalCreated()`:

- Uses `startTime`/`endTime` as timestamps (not block numbers like OZ)
- `target` is the proposal contract address (single target, not arrays)
- `blockTime` parameter will be used to estimate block-based timing where needed

**`ProposalExecuted` event** → mapped to `updateProposalStatus(EXECUTED)`

**`Delegated` event** → mapped to `delegateChanged()`:

- `account` = delegator, `to` = new delegate
- Previous delegate determined from `accountBalance.delegate` state

**`Undelegated` event** → mapped to `delegateChanged()`:

- `account` = delegator, `from` = previous delegate
- New delegate = self (reverts to self-delegation)

### Indexer — Ponder Config

- Chain: `ethereum_mainnet` (chain ID 1)
- Two contracts: `TORNToken` (TORN ERC20) and `TORNGovernor` (Governance)
- Start blocks: token at 11,474,599, governor at 11,474,695

### API — Client

`TORNClient extends GovernorBase implements DAOClient`:

- `getDaoId()` → `"TORN"`
- `getQuorum()` → calls `QUORUM_VOTES()` on governor (returns 100,000 TORN)
- `getTimelockDelay()` → calls `EXECUTION_DELAY()` on governor (no separate timelock)
- `calculateQuorum(votes)` → `votes.forVotes` (Tornado requires forVotes > quorum, no abstain counted)
- `alreadySupportCalldataReview()` → `false` (proposals are contracts, not calldata)
- Custom `getVotingDelay()` → calls `VOTING_DELAY()` (returns seconds, not blocks)
- Custom `getVotingPeriod()` → calls `VOTING_PERIOD()` (returns seconds, not blocks)
- Custom `getProposalThreshold()` → calls `PROPOSAL_THRESHOLD()`

### Gateway

Add `DAO_API_TORN=<api-url>` env var. No code changes needed.

### Dashboard

- DAO config with feature flags
- Color scheme TBD (can use Tornado Cash's green `#94FEBF` or similar)
- Icon component needed
- `daoOverview.rules`:
  - `delay: true` (75s voting delay)
  - `changeVote: false`
  - `timelock: true` (built-in 2-day execution delay)
  - `cancelFunction: false` (no cancel — proposals are immutable contracts)
  - `logic: "For"` (binary: for/against, no abstain)
  - `quorumCalculation: "Fixed at 100,000 TORN"`

### RPC Considerations

Merkle RPC (`eth.merkle.io`) blocks calls to Tornado Cash contracts with `"sanctioned"` error. Must use an alternative:

- User's local reth node (for local dev/testing)
- Llama RPC (`eth.llamarpc.com`) works but is unreliable (502 errors observed)
- Production deployment needs a non-censoring RPC endpoint configured via env var

## Verification Strategy

After implementation, verify data accuracy against on-chain state:

1. **Token supply**: Compare `totalSupply` from indexer vs `cast call` result (~10M TORN)
2. **Proposal count**: Verify all 65 proposals are indexed with correct states
3. **Proposal states**: Compare each proposal's mapped status against `state(proposalId)` on-chain
4. **Vote tallies**: For a sample of proposals, compare `forVotes`/`againstVotes` against on-chain `proposals(id)` struct
5. **Delegation**: Verify a sample of `delegatedTo(address)` on-chain matches indexed delegation state
6. **Locked supply (delegatedSupply)**: Compare total TORN balance of governance contract vs indexed `delegatedSupply`

## What's Pending / Limitations

Document these in `INTEGRATION.md`:

1. **No per-account `votingPowerHistory`**: The standard pattern relies on `DelegateVotesChanged` events which TORN doesn't emit. Voting power = `lockedBalance` in the governor, which changes via lock/unlock (Transfer events). We track `delegatedSupply` as the aggregate, but individual `votingPowerHistory` records won't be populated. To add this, we'd need to detect transfers to/from the governor and create synthetic `votingPowerHistory` entries — achievable but requires careful handling of delegation shifts.

2. **No abstain votes**: Tornado Cash uses binary voting (`bool support`). The `abstainVotes` field on proposals will always be 0. Dashboard should hide the abstain column for TORN.

3. **Vote extension mechanism**: If a vote outcome flips in the last hour (`CLOSING_PERIOD`), voting extends by 6 hours (`VOTE_EXTEND_TIME`). Our indexer won't track this dynamic — `endTime` from `ProposalCreated` is the initial end time. The actual end time may differ for proposals where the extension triggered. This could cause brief status mismatches.

4. **Staking rewards**: The `TornadoStakingRewards` contract distributes relayer fees to locked TORN holders. This is an economic dimension not captured by our indexer. It doesn't affect governance voting directly but is relevant context.

5. **Governance attacks / upgrades**: The contract has been upgraded multiple times (current version: `"5.proposal-state-patch"`), including after the May 2023 governance attack. Our indexer will process all events from genesis, including the attack period. Proposal states should still be correct since we rely on emitted events.

6. **Cancel function**: Tornado Cash proposals cannot be canceled once created (no `ProposalCanceled` event). The `cancelFunction` rule should be set to `false`.

7. **Proposal target decoding**: Proposals are deployed contracts executed via `delegatecall`. We index the `target` address but cannot decode what the proposal does without reading the target contract's bytecode. `alreadySupportCalldataReview` should be `false`.
