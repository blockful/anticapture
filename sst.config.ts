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

    const ethereumRpc = new sst.aws.Secret("EthereumRPC", "http://localhost:8545")

    const db = new sst.aws.Postgres("anticapture-db", {
      vpc,
      dev: {
        username: "postgres",
        password: "postgres",
        port: 5432,
        database: "ens",
      },
    });

    const indexer = new sst.aws.Service("ens-indexer", {
      cluster,
      memory: "1 GB",
      cpu: "0.5 vCPU",
      link: [db],
      retries: 1,
      environment: {
        RPC_URL: $dev ? "http://localhost:8545" : ethereumRpc.value,
        POLLING_INTERVAL: "1000",
        MAX_REQUESTS_PER_SECOND: "20",
        NETWORK: "ethereum",
        DAO_ID: "ENS",
        CHAIN_ID: "1",
        NODE_ENV: $dev ? "development" : "production",
      },
      retry: 1,
      scaling: {
        min: 1,
        max: 2,
        cpuUtilization: 50,
        memoryUtilization: 80,
      },
      image: {
        context: ".",
        dockerfile: "apps/indexer/Dockerfile.indexer",
      },
      loadBalancer: {
        rules: [{ listen: "80/http", forward: "42069/http" }],
      },
      dev: {
        command: "pnpm indexer start --config config/ens.config.ts",
      },
    });

    new sst.aws.Service("api-gateway", {
      cluster,
      memory: "0.5 GB",
      cpu: "0.25 vCPU",
      link: [
        indexer
      ],
      environment: {
        NODE_ENV: $dev ? "development" : "production",
      },
      scaling: {
        min: 1,
        max: 2,
        cpuUtilization: 50,
        memoryUtilization: 80,
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
