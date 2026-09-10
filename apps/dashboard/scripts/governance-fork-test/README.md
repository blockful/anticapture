# Governance fork test

Automated end-to-end test of the full governance lifecycle (create proposal,
vote, queue, execute) against an anvil fork of mainnet, exercising the exact
code the dashboard uses to send transactions:

- `submitProposalRequest` (create-proposal feature) to publish the proposal
- `voteOnProposal` (governance feature) to cast for/against/abstain votes
- `queueProposal` / `executeProposal` (governance feature) to finish the lifecycle

Voters and proposers are the DAO's real top delegates, fetched live from the
Anticapture API and impersonated on the fork, so proposal thresholds and
quorums are met with genuine delegated voting power. Every step asserts the
on-chain proposal state and that the tallies match the cast power exactly.

## Requirements

- [Foundry](https://getfoundry.sh) (`anvil` on PATH, or set `ANVIL_PATH`)
- `BLOCKFUL_API_TOKEN` and optionally `ANTICAPTURE_API_URL` in
  `apps/dashboard/.env` (defaults to the dev gateway) to fetch top delegates

## Usage

```bash
pnpm --filter @anticapture/dashboard test:governance uni
pnpm --filter @anticapture/dashboard test:governance uni comp gtc torn ens
pnpm --filter @anticapture/dashboard test:governance all
```

Environment overrides:

| Variable           | Default                               | Purpose                                       |
| ------------------ | ------------------------------------- | --------------------------------------------- |
| `GOV_FORK_RPC_URL` | `https://ethereum-rpc.publicnode.com` | Mainnet RPC to fork                           |
| `GOV_FORK_PORT`    | `8546`                                | Port for the anvil fork                       |
| `ANVIL_PATH`       | resolved from PATH / `~/.foundry`     | anvil binary                                  |
| `GOV_REAL_TIMING`  | unset                                 | `1` disables the vote-window shortening below |

## Fast timing

Real voting delays/periods span days (13k-45k blocks), far too slow to mine.
The harness shrinks them on the throwaway fork, verified against the
governor's own getters each time:

- UNI and GTC keep `votingDelay`/`votingPeriod` in plain storage slots, which
  are rewritten before proposing.
- COMP and ENS get the created proposal's vote window rewritten inside the
  governor's `_proposals` mapping (plain slots and ERC-7201 namespaced storage
  are both discovered automatically).
- COMP additionally uses `GovernorPreventLateQuorum`; with a short window every
  vote is "late", so the deadline extension is cleared before the final state
  check.

Set `GOV_REAL_TIMING=1` to keep the real windows (expect hours of mining).

## Supported DAOs

| DAO  | Governor                                  | Propose path                               | Queue/execute                      |
| ---- | ----------------------------------------- | ------------------------------------------ | ---------------------------------- |
| UNI  | GovernorBravo                             | dashboard (`submitProposalRequest`)        | yes                                |
| COMP | OZ v5 Governor (block clock, late quorum) | dashboard                                  | yes                                |
| GTC  | OZ Governor (hash ids, named "Bravo")     | dashboard                                  | yes                                |
| ENS  | OZ Governor                               | dashboard                                  | yes                                |
| TORN | Tornado custom (timestamp)                | dashboard (`propose(target, description)`) | execute only (no queue on Tornado) |

TORN proposals delegatecall their target on execution, so the harness gives a
synthetic proposal contract a single STOP opcode via `setCode` before
proposing, votes through `voteOnProposal`, and executes through
`executeProposal` after the execution delay.

A failing DAO is the harness doing its job: it means this branch's dashboard
cannot run that DAO's governance on-chain. Known gaps at the time of writing:
UNI needs the GovernorBravo propose path (`feat/uniswap-whitelabel`), and TORN
needs the Tornado whitelabel PR (propose/execute paths and the `castVote`
fallback for voters without delegators). Both pass on their respective
branches.
