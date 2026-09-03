import { type Address, getAddress } from "viem";

import { DaoIdEnum } from "@/shared/types/daos";

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

// Curated per-DAO token list. Deliberately carries no decimals — decimals are
// always read on-chain so the list can never disagree with the token contract.
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
  [DaoIdEnum.UNISWAP]: [
    trustWalletToken("USDT", "0xdac17f958d2ee523a2206206994597c13d831ec7"),
    trustWalletToken("USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    trustWalletToken("DAI", "0x6b175474e89094c44da98b954eedeac495271d0f"),
    trustWalletToken("WETH", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    trustWalletToken("UNI", "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"),
  ],
  [DaoIdEnum.COMP]: [
    trustWalletToken("USDT", "0xdac17f958d2ee523a2206206994597c13d831ec7"),
    trustWalletToken("USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    trustWalletToken("DAI", "0x6b175474e89094c44da98b954eedeac495271d0f"),
    trustWalletToken("WETH", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    trustWalletToken("COMP", "0xc00e94cb662c3520282e6f5717214004a7f26888"),
  ],
  [DaoIdEnum.GITCOIN]: [
    trustWalletToken("USDT", "0xdac17f958d2ee523a2206206994597c13d831ec7"),
    trustWalletToken("USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    trustWalletToken("DAI", "0x6b175474e89094c44da98b954eedeac495271d0f"),
    trustWalletToken("WETH", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    trustWalletToken("GTC", "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f"),
  ],
};
