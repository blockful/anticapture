import { DaoIdEnum } from "@/shared/types/daos";

export const BODY_CHAR_LIMIT = 100_000;
export const BODY_WARNING_THRESHOLD = 95_000;

export const canCreateProposalForDao = (daoId: DaoIdEnum | null | undefined) =>
  daoId === DaoIdEnum.ENS ||
  daoId === DaoIdEnum.SHU ||
  daoId === DaoIdEnum.UNISWAP ||
  daoId === DaoIdEnum.TORN ||
  daoId === DaoIdEnum.COMP ||
  daoId === DaoIdEnum.GITCOIN;

export const PROPOSAL_JSON_PLACEHOLDER = `{
  "title": "Proposal title",
  "discussionUrl": "https://discuss...",
  "body": "## Synopsis\\n\\nMarkdown description.",
  "actions": [
    {"type": "eth-transfer", "recipient": "0x...", "amount": "600"},
    {"type": "erc20-transfer", "tokenAddress": "0x...",
     "recipient": "0x...", "amount": "480000"},
    {"type": "custom", "contractAddress": "0x...",
     "calldata": "0x..."}
  ]
}`;

export const PROPOSAL_IMPORT_EXAMPLE = `{
  "title": "Proposal title",
  "discussionUrl": "https://discuss...",
  "body": "## Synopsis\\n\\nMarkdown description.",
  "actions": [
    {"type": "eth-transfer", "recipient": "0x93a8f8072337F2D1Ff2D019761cE0ABa39723d7B", "amount": "600"},
    {"type": "erc20-transfer", "tokenAddress": "0x06E98ADbc7C60fe88e7b03E927cDFF17d7D798A3", "recipient": "0x26D5EB37002152186ec86B9835ecAf32846bC0DD", "amount": "480000"},
    {"type": "custom", "contractAddress": "0x73f9ccC34d14754dEfD9acdC9C4F4E37b184A639", "calldata": "0x1896f70a7a7b069bdf427c3e6d24c2c55ccd9fe71f5d9a6088733138764bb52de176915700000000000000000000000073f9ccc34d14754defd9acdc9c4f4e37b184a639"},
    {"type": "custom", "contractAddress": "0x73f9ccC34d14754dEfD9acdC9C4F4E37b184A639",
     "functionName": "createStream",
     "abi": [{"type": "function", "name": "createStream", "stateMutability": "nonpayable", "outputs": [],
              "inputs": [{"name": "recipient", "type": "address"},
                         {"name": "durations", "type": "tuple",
                          "components": [{"name": "cliff", "type": "uint256"},
                                         {"name": "total", "type": "uint256"}]}]}],
     "args": ["0x26D5EB37002152186ec86B9835ecAf32846bC0DD", {"cliff": "2592000", "total": "7776000"}]}
  ]
}`;

export const PROPOSAL_IMPORT_SPEC = `Anticapture: proposal import format (v1, 2026-08)

Return a single JSON object and nothing else. No prose, no markdown fences.

FIELDS
  title           the proposal title
  discussionUrl   an http(s) link to the forum thread
  body            the description, in markdown
  actions         one entry per action, keyed by type:

    eth-transfer    recipient, and amount in ETH
    erc20-transfer  also tokenAddress. Its decimals are read from the token,
                    so never supply them
    custom          contractAddress, then either functionName with abi and
                    args, or raw calldata. Not both, not neither

RULES
- Every field is optional. Only fields present are replaced; omitted fields
  keep their current value in the form.
- Every figure must be a quoted string. Unquoted numbers lose precision.
- Amounts are human-readable, never wei. "1.5" means 1.5 ETH.
- recipient takes an address or an ENS name.
- args has one entry per ABI input, in order. Integers, addresses and bytesN
  are quoted strings; booleans stay booleans. A tuple is an object keyed by
  component name, or an array in component order.
- Addresses below are placeholders. Substitute the real ones.

EXAMPLE

${PROPOSAL_IMPORT_EXAMPLE}`;

export const BODY_PLACEHOLDER = `## Synopsis

State what the proposal does in one sentence.

## Motivation

What problem does this solve? Why now?

## Specification

How exactly will this be executed? Be specific and leave no ambiguity.

## Rationale

Why is this specification appropriate?

## Risks

What might go wrong?

## Timeline

When exactly should this proposal take effect? When exactly should this proposal end?
`;
