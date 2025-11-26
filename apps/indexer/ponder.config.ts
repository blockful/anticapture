import arbitrumConfig from "./config/arbitrum.config";
import ensConfig from "./config/ens.config";
import uniswapConfig from "./config/uniswap.config";
import optimismConfig from "./config/optimism.config";
import gitcoinConfig from "./config/gitcoin.config";
import nounsConfig from "./config/nouns.config";
import scrollConfig from "./config/scroll.config";
import compoundConfig from "./config/compound.config";
import obolConfig from "./config/obol.config";
import zkConfig from "./config/zk.config";

export default {
  chains: {
    ...arbitrumConfig.chains,
    ...ensConfig.chains,
    ...uniswapConfig.chains,
    ...optimismConfig.chains,
    ...gitcoinConfig.chains,
    ...nounsConfig.chains,
    ...scrollConfig.chains,
    ...compoundConfig.chains,
    ...obolConfig.chains,
    ...zkConfig.chains,
  },
  contracts: {
    ...arbitrumConfig.contracts,
    ...ensConfig.contracts,
    ...uniswapConfig.contracts,
    ...optimismConfig.contracts,
    ...gitcoinConfig.contracts,
    ...nounsConfig.contracts,
    ...scrollConfig.contracts,
    ...compoundConfig.contracts,
    ...obolConfig.contracts,
    ...zkConfig.contracts,
  },
};
