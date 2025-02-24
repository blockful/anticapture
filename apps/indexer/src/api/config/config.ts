export interface Config {
  duneApiUrl: string;
  duneApiKey: string;
  redisUrl?: string;
}

export const getApiConfig = (): Config => {
  const config: Config = {
    duneApiUrl: process.env.DUNE_API_URL || "",
    duneApiKey: process.env.DUNE_API_KEY || "",
    redisUrl: process.env.REDIS_URL,
  };

  if (!config.duneApiUrl || !config.duneApiKey) {
    throw new Error(
      "Missing required environment variables: DUNE_API_URL or DUNE_API_KEY",
    );
  }

  return config;
};
