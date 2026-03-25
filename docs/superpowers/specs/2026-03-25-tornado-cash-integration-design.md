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

| On-chain State    | Value | Maps to Anticapture | How tracked                    |
| ----------------- | ----- | ------------------- | ------------------------------ |
| Pending           | 0     | PENDING             | Computed by API (time-based)   |
| Active            | 1     | ACTIVE              | Computed by API (time-based)   |
| Defeated          | 2     | DEFEATED            | Computed by API (vote tallies) |
| Timelocked        | 3     | QUEUED              | Computed by API (time-based)   |
| AwaitingExecution | 4     | PENDING_EXECUTION   | Computed by API (time-based)   |
| Executed          | 5     | EXECUTED            | Indexed via ProposalExecuted   |
| Expired           | 6     | EXPIRED             | Computed by API (time-based)   |

**Note**: Unlike OZ governors, Tornado Cash does NOT emit events for state transitions (no `ProposalQueued`, no `ProposalCanceled`). Only `ProposalCreated` and `ProposalExecuted` are emitted. All intermediate states (Pending, Active, Defeated, Timelocked, AwaitingExecution, Expired) are computed at the API level via `TORNClient.getProposalStatus()` using timestamp comparisons. The indexer sets initial status to PENDING on `ProposalCreated` and EXECUTED on `ProposalExecuted`.

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

### Step 1: Enum Sync

Add `TORN = "TORN"` to `DaoIdEnum` in all three locations:

- `apps/indexer/src/lib/enums.ts`
- `apps/api/src/lib/enums.ts`
- `apps/dashboard/shared/types/daos.ts`

### Step 2: Indexer

#### Token Handler (`erc20.ts`)

Handle `Transfer` events using the standard `tokenTransfer()` utility:

- Balance tracking for all accounts
- CEX/DEX/Lending/Treasury/NonCirculating supply classification
- Circulating supply calculation

**Lock tracking via Transfer**: When TORN is transferred to/from the Governance contract address (`0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce`):

- Transfer TO governor = lock (user locks TORN for voting power)
- Transfer FROM governor = unlock (user withdraws TORN)
- Use these to update `delegatedSupply` via `updateDelegatedSupply()` — locked TORN represents the total voting power pool
- Amount: `+value` for lock (TO governor), `-value` for unlock (FROM governor)

**Address classification**: The governance contract address must be added to `NonCirculatingAddresses[DaoIdEnum.TORN]` since locked TORN is not part of circulating supply.

#### Governor Handler (`governor.ts`) — Custom Implementation

The governor handler uses **custom event handlers** (not the shared `proposalCreated()` utility) because Tornado Cash's `ProposalCreated` event provides timestamps, not block numbers. This follows the SHU precedent of writing directly to the schema when the shared utility doesn't fit.

**`Voted` event** → mapped to `voteCast()`:

- `bool support` converted via `event.args.support ? 1 : 0` (for=1, against=0)
- No abstain support (Tornado Cash doesn't have it)
- `votes` field provides the voting power used
- `reason` field: pass empty string `""` (Tornado Cash `Voted` event has no reason parameter)

**`ProposalCreated` event** → custom handler (NOT shared `proposalCreated()`):

- Writes directly to `proposalsOnchain` table
- `startTime` and `endTime` are stored as-is (timestamps, not block numbers)
- `startBlock` / `endBlock` fields: store synthetic values by converting timestamps to estimated block numbers using `(timestamp - event.block.timestamp) / blockTime + event.block.number`
- `target` is the proposal contract address (single target, not arrays)
- Initial status set to `PENDING`

**`ProposalExecuted` event** → mapped to `updateProposalStatus(EXECUTED)`

**`Delegated` event** → mapped to `delegateChanged()`:

- `delegator = event.args.account`, `delegate = event.args.to`
- `previousDelegate` determined from `accountBalance.delegate` state
- `tokenId` = TORN token address (not the governor address), to maintain consistency with how other DAOs key delegation records in the data model

**`Undelegated` event** → mapped to `delegateChanged()`:

- `delegator = event.args.account`, `delegate = event.args.account` (self)
- `previousDelegate = event.args.from`
- `tokenId` = TORN token address

#### ABIs (`apps/indexer/src/indexer/torn/abi/`)

- `token.ts`: Standard ERC20 ABI (Transfer event only — no delegation events)
- `governor.ts`: Custom ABI for Tornado Cash governance (ProposalCreated, Voted, ProposalExecuted, Delegated, Undelegated)
- `index.ts`: Re-exports both as `TORNTokenAbi` and `TORNGovernorAbi`

#### Ponder Config (`apps/indexer/config/torn.config.ts`)

- Chain: `ethereum_mainnet` (chain ID 1)
- Two contracts: `TORNToken` and `TORNGovernor`
- Start blocks: token at 11,474,599, governor at 11,474,695

#### Constants (`apps/indexer/src/lib/constants.ts`)

Add `CONTRACT_ADDRESSES[DaoIdEnum.TORN]` with token and governor entries. Add governance contract to `NonCirculatingAddresses`. Add known CEX/DEX/Treasury addresses if available.

#### Wiring

- Import `torn.config.ts` in `apps/indexer/ponder.config.ts` and spread chains/contracts
- Add switch case in `apps/indexer/src/index.ts` for `DaoIdEnum.TORN`

### Step 3: API

#### Client (`apps/api/src/clients/torn/index.ts`)

`TORNClient extends GovernorBase implements DAOClient`:

- `getDaoId()` → `"TORN"`
- **Override** `getQuorum()` → calls `QUORUM_VOTES()` on governor (SCREAMING_SNAKE_CASE, not camelCase)
- **Override** `getTimelockDelay()` → calls `EXECUTION_DELAY()` on governor (no separate timelock)
- `calculateQuorum(votes)` → `votes.forVotes` (Tornado requires forVotes > quorum, no abstain counted)
- `alreadySupportCalldataReview()` → `false`
- **Override** `getVotingDelay()` → calls `VOTING_DELAY()` (SCREAMING_SNAKE_CASE, returns seconds)
- **Override** `getVotingPeriod()` → calls `VOTING_PERIOD()` (SCREAMING_SNAKE_CASE, returns seconds)
- **Override** `getProposalThreshold()` → calls `PROPOSAL_THRESHOLD()` (SCREAMING_SNAKE_CASE)
- **Override** `getProposalStatus()` → **timestamp-based status computation** instead of block-based. This is critical because the base `GovernorBase.getProposalStatus()` compares `currentBlock` against `startBlock`/`endBlock`, but Tornado Cash uses timestamp-based governance. The override must use `currentTimestamp` against `startTime`/`endTime` and apply Tornado Cash's state machine logic: Pending → Active → (Defeated | Timelocked → AwaitingExecution → (Executed | Expired))

#### ABI

Create `apps/api/src/clients/torn/abi.ts` with the governor ABI containing the SCREAMING_SNAKE_CASE function signatures.

#### Wiring

- Export from `apps/api/src/clients/index.ts`
- Add to `getClient()` factory in `apps/api/src/lib/client.ts`

#### Constants (`apps/api/src/lib/constants.ts`)

Mirror `CONTRACT_ADDRESSES[DaoIdEnum.TORN]` from the indexer.

### Step 4: Gateway

Add `DAO_API_TORN=<api-url>` env var. No code changes needed.

### Step 5: Dashboard

#### DAO Config (`apps/dashboard/shared/dao-config/torn.ts`)

- Color scheme: Tornado Cash green `#94FEBF` or similar
- Icon component needed in `apps/dashboard/shared/components/icons/`
- Feature flags: `resilienceStages: true`, `tokenDistribution: true`, `dataTables: true`, `governancePage: true`
- `daoOverview.rules`:
  - `delay: true` (75s voting delay)
  - `changeVote: false`
  - `timelock: true` (built-in 2-day execution delay)
  - `cancelFunction: false` (no cancel — proposals are immutable contracts)
  - `logic: "For"` (binary: for/against, no abstain)
  - `quorumCalculation: "Fixed at 100,000 TORN"`

#### Wiring

- Register config in `apps/dashboard/shared/dao-config/index.ts`
- Add to `DaoIdEnum` in `apps/dashboard/shared/types/daos.ts` (covered in Step 1)

### RPC Considerations

Merkle RPC (`eth.merkle.io`) blocks calls to Tornado Cash contracts with `"sanctioned"` error. Must use an alternative:

- User's local reth node (for local dev/testing and indexer)
- Llama RPC (`eth.llamarpc.com`) works but is unreliable (502 errors observed)
- Production: configure a non-censoring RPC endpoint via `RPC_URL` env var (e.g., user's own reth node or a private RPC provider)

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

3. **Vote extension mechanism**: If a vote outcome flips in the last hour (`CLOSING_PERIOD`), voting extends by 6 hours (`VOTE_EXTEND_TIME`). Our indexer won't track this dynamic — `endTime` from `ProposalCreated` is the initial end time. The actual end time may differ for proposals where the extension triggered. This could cause brief status mismatches during the extension window.

4. **Staking rewards**: The `TornadoStakingRewards` contract distributes relayer fees to locked TORN holders. This is an economic dimension not captured by our indexer. It doesn't affect governance voting directly but is relevant context.

5. **Governance attacks / upgrades**: The contract has been upgraded multiple times (current version: `"5.proposal-state-patch"`), including after the May 2023 governance attack where an attacker gained majority voting power via a malicious proposal. Our indexer will process all events from genesis, including the attack period. The indexed data will accurately reflect this period, which may show unusual voting power concentration on the dashboard.

6. **Cancel function**: Tornado Cash proposals cannot be canceled once created (no `ProposalCanceled` event). The `cancelFunction` rule should be set to `false`.

7. **Proposal target decoding**: Proposals are deployed contracts executed via `delegatecall`. We index the `target` address but cannot decode what the proposal does without reading the target contract's bytecode. `alreadySupportCalldataReview` should be `false`.

8. **Timestamp-based governance timing**: All governance parameters (voting delay, period, execution delay) are in seconds, not blocks. The `TORNClient.getProposalStatus()` override uses timestamp comparisons. Synthetic block numbers are stored for schema compatibility but are estimates.
