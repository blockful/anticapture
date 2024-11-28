import {
  trustWallet,
  walletConnectWallet,
  rainbowWallet,
  coinbaseWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { createPublicClient, createWalletClient } from "viem";
import { mainnet } from "viem/chains";

const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;

if (alchemyApiKey == undefined) {
  throw new Error("Missing API key for mainnet environment");
}

export const rpcHttpUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;

export const publicClient = createPublicClient({
  chain: mainnet,
  batch: { multicall: true },
  transport: http(),
});

export const walletClient = createWalletClient({
  chain: mainnet,
  transport: http(rpcHttpUrl),
});

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "";

if (!projectId) throw new Error("Missing WalletConnect project ID");

export const appName = "Governance Dashboard";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Which wallet will you use?",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        trustWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    projectId,
    appName,
  }
);

const wagmiConfig = createConfig({
  connectors,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(rpcHttpUrl),
  },
});

export { wagmiConfig };
