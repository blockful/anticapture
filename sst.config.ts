/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "anticapture",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("anticapture-vpc");
    const cluster = new sst.aws.Cluster("anticapture-cluster", { vpc });

    const ethereumRpc = new sst.Secret("EthereumRPC", "http://localhost:8545")

    const db = new sst.aws.Postgres("AnticaptureDB", {
      vpc,
      dev: {
        username: "postgres",
        password: "postgres",
        port: 5432,
        database: "ens",
      },
    });

    new sst.aws.Service("EnsIndexer", {
      cluster,
      memory: "0.5 GB",
      cpu: "0.25 vCPU",
      link: [db],
      environment: {
        RPC_URL: $dev ? "http://localhost:8545" : ethereumRpc.value,
        POLLING_INTERVAL: "1000",
        MAX_REQUESTS_PER_SECOND: "20",
        NETWORK: "ethereum",
        DAO_ID: "ENS",
        CHAIN_ID: "1",
        NODE_ENV: $dev ? "development" : "production",
      },
      image: {
        context: ".",
        dockerfile: "apps/indexer/Dockerfile.indexer",
      },
      dev: {
        command: "pnpm indexer start --config config/ens.config.ts",
      },
    });

    const duneApiUrl = new sst.Secret("DuneAPIUrl")
    const duneApiKey = new sst.Secret("DuneAPIKey")
    const coingeckoApiKey = new sst.Secret("CoingeckoAPIKey")

    const indexerAPI = new sst.aws.Service("EnsIndexerAPI", {
      cluster,
      memory: "0.5 GB",
      cpu: "0.25 vCPU",
      link: [db],
      environment: {
        RPC_URL: $dev ? "http://localhost:8545" : ethereumRpc.value,
        NETWORK: "ethereum",
        DAO_ID: "ENS",
        CHAIN_ID: "1",
        NODE_ENV: $dev ? "development" : "production",
        DUNE_API_URL: duneApiUrl.value,
        DUNE_API_KEY: duneApiKey.value,
        COINGECKO_API_KEY: coingeckoApiKey.value,
      },
      scaling: {
        min: 1,
        max: 1,
        // cpuUtilization: 50,
        // memoryUtilization: 80,
      },
      image: {
        context: ".",
        dockerfile: "apps/indexer/Dockerfile.api",
      },
      loadBalancer: {
        rules: [{ listen: "80/http", forward: "42069/http" }],
      },
      dev: {
        command: "pnpm indexer serve --config config/ens.config.ts",
      },
    });

    new sst.aws.Service("APIGateway", {
      cluster,
      memory: "0.5 GB",
      cpu: "0.25 vCPU",
      link: [
        indexerAPI
      ],
      environment: {
        NODE_ENV: $dev ? "development" : "production",
      },
      image: {
        context: ".",
        dockerfile: "apps/api-gateway/Dockerfile",
      },
      loadBalancer: {
        rules: [{ listen: "80/http", forward: "4000/http" }],
      },
      dev: {
        command: "pnpm gateway dev",
      },
    });
  },
});
