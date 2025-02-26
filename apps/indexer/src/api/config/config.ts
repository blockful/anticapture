import dotenv from "dotenv";

dotenv.config();

export interface Config {
  duneApiUrl: string;
  duneApiKey: string;
  coingeckoApiKey: string;
  redisUrl?: string;
}

export const getApiConfig = (): Config => {
  const config: Config = {
    duneApiUrl: process.env.DUNE_API_URL || "",
    duneApiKey: process.env.DUNE_API_KEY || "",
    redisUrl: process.env.REDIS_URL,
    coingeckoApiKey: process.env.COINGECKO_API_KEY || "",
  };

  if (!config.duneApiUrl || !config.duneApiKey) {
    throw new Error(
      "Missing required environment variables: DUNE_API_URL or DUNE_API_KEY",
    );
  }

  if (!config.coingeckoApiKey) {
    throw new Error(
      "Missing required environment variables: COINGECKO_API_KEY",
    );
  }

  return config;
};
