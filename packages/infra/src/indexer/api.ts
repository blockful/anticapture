/// <reference path="../../.sst/platform/config.d.ts" />

import { Output } from "@pulumi/pulumi";

export function newIndexerAPI(
  dao: string,
  cluster: sst.aws.Cluster,
  db: sst.aws.Postgres,
  rpcUrl: Output<string>,
  schema: string,
): sst.aws.Service {
  // const duneApiUrl = new sst.Secret("DuneAPIUrl")
  // const duneApiKey = new sst.Secret("DuneAPIKey")
  // const coingeckoApiKey = new sst.Secret("CoingeckoAPIKey")

  return new sst.aws.Service(`${dao}IndexerAPI`, {
    cluster,
    memory: "0.5 GB",
    cpu: "0.25 vCPU",
    link: [db],
    health: {
      command: ["CMD-SHELL", "curl -f http://localhost:42069/health || exit 1"],
      interval: "300 seconds",
      timeout: "30 seconds",
      retries: 3,
      startPeriod: "40 seconds",
    },
    environment: {
      DATABASE_URL: $interpolate`postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`,
      RPC_URL: rpcUrl,
      NETWORK: "ethereum",
      DAO_ID: dao,
      CHAIN_ID: "1",
      NODE_ENV: $dev ? "development" : "production",
      // DUNE_API_URL: duneApiUrl?.value,
      // DUNE_API_KEY: duneApiKey?.value,
      // COINGECKO_API_KEY: coingeckoApiKey?.value,
    },
    scaling: {
      min: 1,
      max: 1,
      cpuUtilization: 50,
      memoryUtilization: 80,
    },
    capacity: {
      fargate: { base: 1, weight: 0 }, // mandatory 1 fargate instance
      spot: { weight: 1 }, // additional as spot instances
    },
    image: {
      context: "../..",
      dockerfile: "apps/indexer/Dockerfile.api",
      args: {
        CONFIG_FILE: `config/${dao.toLowerCase()}.config.ts`,
        SCHEMA: schema
      },
    },
    loadBalancer: {
      public: false,
      rules: [{ listen: "80/http", forward: "42069/http" }],
    },
    dev: {
      command: `pnpm -w indexer serve --config config/${dao.toLowerCase()}.config.ts --schema=${schema}`,
    },
  });
}