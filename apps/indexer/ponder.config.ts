import arbitrumConfig from "./config/arbitrum.config";
import ensConfig from "./config/ens.config";
import uniswapConfig from "./config/uniswap.config";
import optimismConfig from "./config/optimism.config";

export default {
  chains: {
    ...arbitrumConfig.chains,
    ...ensConfig.chains,
    ...uniswapConfig.chains,
    ...optimismConfig.chains,
  },
  contracts: {
    ...arbitrumConfig.contracts,
    ...ensConfig.contracts,
    ...uniswapConfig.contracts,
    ...optimismConfig.contracts,
  },
};
