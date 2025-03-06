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

  if (!config.duneApiUrl || !config.duneApiKey || !config.coingeckoApiKey) {
    throw new Error(
      `Missing required environment variables: ${[
        !config.duneApiUrl ? "DUNE_API_URL" : "",
        !config.duneApiKey ? "DUNE_API_KEY" : "",
        !config.coingeckoApiKey ? "COINGECKO_API_KEY" : "",
      ].join(",")}`,
    );
  }

  return config;
};
