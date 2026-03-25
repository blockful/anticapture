import aaveConfig from "./config/aave.config";
import arbitrumConfig from "./config/arbitrum.config";
import compoundConfig from "./config/compound.config";
import ensConfig from "./config/ens.config";
import fluidConfig from "./config/fluid.config";
import gitcoinConfig from "./config/gitcoin.config";
import lilnounsConfig from "./config/lil-nouns.config";
import nounsConfig from "./config/nouns.config";
import obolConfig from "./config/obol.config";
import optimismConfig from "./config/optimism.config";
import scrollConfig from "./config/scroll.config";
import shutterConfig from "./config/shutter.config";
import tornConfig from "./config/torn.config";
import uniswapConfig from "./config/uniswap.config";
import zkConfig from "./config/zk.config";

export default {
  chains: {
    ...aaveConfig.chains,
    ...arbitrumConfig.chains,
    ...ensConfig.chains,
    ...fluidConfig.chains,
    ...uniswapConfig.chains,
    ...optimismConfig.chains,
    ...gitcoinConfig.chains,
    ...lilnounsConfig.chains,
    ...nounsConfig.chains,
    ...scrollConfig.chains,
    ...compoundConfig.chains,
    ...obolConfig.chains,
    ...zkConfig.chains,
    ...shutterConfig.chains,
    ...tornConfig.chains,
  },
  contracts: {
    ...aaveConfig.contracts,
    ...arbitrumConfig.contracts,
    ...ensConfig.contracts,
    ...fluidConfig.contracts,
    ...uniswapConfig.contracts,
    ...optimismConfig.contracts,
    ...gitcoinConfig.contracts,
    ...lilnounsConfig.contracts,
    ...nounsConfig.contracts,
    ...scrollConfig.contracts,
    ...compoundConfig.contracts,
    ...obolConfig.contracts,
    ...zkConfig.contracts,
    ...shutterConfig.contracts,
    ...tornConfig.contracts,
  },
};
