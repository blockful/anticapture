import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  trustWallet,
  walletConnectWallet,
  rainbowWallet,
  coinbaseWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createWalletClient } from "viem";
import { createConfig, http } from "wagmi";
import { mainnet, optimism, scroll } from "wagmi/chains";

// The RPC proxy path must be absolute in the browser: wagmi hands these
// transport URLs to the WalletConnect provider's rpcMap, whose HTTP
// connection rejects relative URLs (breaking every WalletConnect pairing
// right after session approval). During SSR the transports are never
// called, so the relative path is fine there.
const origin = typeof window === "undefined" ? "" : window.location.origin;

const rpcTransport = (chainId: number) => http(`${origin}/api/rpc/${chainId}`);

export const walletClient = createWalletClient({
  chain: mainnet,
  transport: rpcTransport(mainnet.id),
});

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "anticapture";
if (!projectId) throw new Error("Missing WalletConnect project ID");

export const appName = "Anticapture";

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
  },
);

const wagmiConfig = createConfig({
  connectors,
  chains: [mainnet, optimism, scroll],
  transports: {
    [mainnet.id]: rpcTransport(mainnet.id),
    [optimism.id]: rpcTransport(optimism.id),
    [scroll.id]: rpcTransport(scroll.id),
  },
});

export { wagmiConfig };
