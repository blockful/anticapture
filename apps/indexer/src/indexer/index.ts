// import { createPublicClient, http } from "viem";

// import { env } from "@/env";
// import { getChain } from "@/lib/utils";
// import { NetworkEnum } from "@/lib/enums";
// import { CONTRACT_ADDRESSES } from "@/lib/constants";
// import { ENSIndexer } from "@/indexer/ens/indexing";
// import { ENSGovernor } from "@/indexer/ens/governor";
// import { UNIIndexer } from "@/indexer/uni/indexing";
// import { UNIGovernor } from "@/indexer/uni/governor";
// import { ARBIndexer } from "@/indexer/arb/indexing";

// const {
//   NETWORK: network,
//   DAO_ID: daoId,
//   CHAIN_ID: chainId,
//   RPC_URL: rpcUrl,
// } = env;

// const tokenAddress = CONTRACT_ADDRESSES[network][daoId]!.token;
// if (!tokenAddress) {
//   throw new Error(
//     `Token address not found for network ${network} and daoId ${daoId}`,
//   );
// }

// const chain = getChain(chainId);
// if (!chain) {
//   throw new Error(`Chain not found for chainId ${chainId}`);
// }
// console.log("Connected to chain", chain.name);

// const client = createPublicClient({
//   chain,
//   transport: http(rpcUrl),
// });

// switch (network) {
//   case NetworkEnum.MAINNET: {
//     // const ensGovernor = new ENSGovernor(client, tokenAddress);
//     // new ENSIndexer(ensGovernor, tokenAddress);
//     // const uniGovernor = new UNIGovernor(client, tokenAddress);
//     // new UNIIndexer(uniGovernor, tokenAddress);
//     // break;
//   }
//   case NetworkEnum.ARBITRUM: {
//     new ARBIndexer(tokenAddress);
//     break;
//   }
//   default:
//     throw new Error(`Unsupported network ${network}`);
// }
