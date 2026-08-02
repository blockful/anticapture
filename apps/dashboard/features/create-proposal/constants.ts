import { type Address, getAddress } from "viem";

import { DaoIdEnum } from "@/shared/types/daos";

export const BODY_CHAR_LIMIT = 10_000;
export const BODY_WARNING_THRESHOLD = 9_500;

export const canCreateProposalForDao = (daoId: DaoIdEnum | null | undefined) =>
  daoId === DaoIdEnum.ENS || daoId === DaoIdEnum.SHU;

export interface SuggestedTransferToken {
  symbol: string;
  address: Address;
  logoUri: string;
}

const trustWalletToken = (
  symbol: string,
  rawAddress: string,
): SuggestedTransferToken => {
  const address = getAddress(rawAddress);
  return {
    symbol,
    address,
    logoUri: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`,
  };
};

export const SUGGESTED_TRANSFER_TOKENS: Partial<
  Record<DaoIdEnum, SuggestedTransferToken[]>
> = {
  [DaoIdEnum.ENS]: [
    trustWalletToken("USDT", "0xdac17f958d2ee523a2206206994597c13d831ec7"),
    trustWalletToken("USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    trustWalletToken("DAI", "0x6b175474e89094c44da98b954eedeac495271d0f"),
    trustWalletToken("WETH", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    trustWalletToken("ENS", "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72"),
  ],
};

/** Reference document shown in (and loadable from) the Import JSON modal. */
export const PROPOSAL_JSON_EXAMPLE = `{
  "title": "Fund the developer grants program",
  "discussionUrl": "https://discuss.ens.domains/t/example",
  "body": "## Synopsis\\n\\nWhat this proposal does.",
  "actions": [
    {
      "type": "eth-transfer",
      "recipient": "0x1111111111111111111111111111111111111111",
      "amount": "1.5"
    },
    {
      "type": "erc20-transfer",
      "recipient": "vitalik.eth",
      "tokenAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "amount": "25000",
      "decimals": 6
    },
    {
      "type": "custom",
      "contractAddress": "0x2222222222222222222222222222222222222222",
      "abi": [
        {
          "type": "function",
          "name": "setValue",
          "stateMutability": "nonpayable",
          "inputs": [{ "name": "value", "type": "uint256" }],
          "outputs": []
        }
      ],
      "functionName": "setValue(uint256)",
      "args": ["42"]
    },
    {
      "type": "custom",
      "contractAddress": "0x3333333333333333333333333333333333333333",
      "calldata": "0xa9059cbb"
    }
  ]
}`;

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
