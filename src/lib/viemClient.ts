import { createPublicClient, getContract, http } from "viem";
import { config, ViemConfig } from "../../config";
import { UNITokenAbi } from "@/uni/abi";
import dotenv from "dotenv";
dotenv.config();

const viemConfig =
  config.viem[process.env.STATUS as "production" | "staging" | "test"];
const ponderConfig =
  config.ponder[process.env.STATUS as "production" | "staging" | "test"];

const viemClient = (viemConfig: ViemConfig) => {
  const publicClient = createPublicClient({
    chain: viemConfig.chain,
    transport: http(viemConfig.url),
  });

  const tokenConfigsByDaoId = {
    UNI: {
      abi: UNITokenAbi,
      address: ponderConfig.contracts.UNIToken.address,
    },
  };
  const getTotalSupply = async () => {
    const tokenContract = getContract({
      client: publicClient,
      abi: tokenConfigsByDaoId["UNI"].abi,
      address: tokenConfigsByDaoId["UNI"].address,
    });
    return await tokenContract.read.totalSupply();
  };


  const getDecimals = async () => {
    const tokenContract = getContract({
      client: publicClient,
      abi: tokenConfigsByDaoId["UNI"].abi,
      address: tokenConfigsByDaoId["UNI"].address,
    });
    return await tokenContract.read.decimals();
  };

  return { getTotalSupply, getDecimals, tokenConfigsByDaoId };
};

export default viemClient(viemConfig);
