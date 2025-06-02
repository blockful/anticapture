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

    const db = new sst.aws.Postgres("anticapture-db", {
      vpc,
      dev: {
        username: "postgres",
        password: "postgres",
        port: 5432,
        database: "ens",
      },
    });

    new sst.aws.Service("ens-indexer", {
      cluster,
      memory: "1 GB",
      cpu: "0.5 vCPU",
      link: [db],
      retries: 1,
      environment: {
        RPC_URL: "http://localhost:8545",
        POLLING_INTERVAL: "1000",
        MAX_REQUESTS_PER_SECOND: "20",
        NETWORK: "ethereum",
        DAO_ID: "ENS",
        CHAIN_ID: "1",
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
        command: "pnpm indexer serve --config config/ens.config.ts",
      },
    });
  },
});
