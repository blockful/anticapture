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

const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
// eRPC "dashboard" project base URL, e.g. https://<erpc-host>/dashboard
const erpcUrl = process.env.NEXT_PUBLIC_ERPC_URL;
const erpcSecret = process.env.NEXT_PUBLIC_ERPC_SECRET;

const rpcTransport = (chainId: number, alchemySubdomain: string) =>
  erpcUrl && erpcSecret
    ? http(`${erpcUrl}/evm/${chainId}`, {
        fetchOptions: { headers: { "X-ERPC-Secret-Token": erpcSecret } },
      })
    : http(`https://${alchemySubdomain}.g.alchemy.com/v2/${alchemyApiKey}`);

export const walletClient = createWalletClient({
  chain: mainnet,
  transport: rpcTransport(mainnet.id, "eth-mainnet"),
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
    [mainnet.id]: rpcTransport(mainnet.id, "eth-mainnet"),
    [optimism.id]: rpcTransport(optimism.id, "opt-mainnet"),
    [scroll.id]: rpcTransport(scroll.id, "scroll-mainnet"),
  },
});

export { wagmiConfig };
