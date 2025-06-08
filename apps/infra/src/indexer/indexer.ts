/// <reference path="../../.sst/platform/config.d.ts" />

import { Output } from "@pulumi/pulumi";

export function newIndexer(
  cluster: sst.aws.Cluster,
  db: sst.aws.Postgres,
  rpcUrl: Output<string>
): sst.aws.Service {
  return new sst.aws.Service("EnsIndexer", {
    cluster,
    memory: "0.5 GB",
    cpu: "0.25 vCPU",
    link: [db],
    loadBalancer: {
      // public: false,
      rules: [{ listen: "80/http", forward: "42069/http" }],
    },
    health: {
      command: ["CMD-SHELL", "curl -f http://localhost:42069/health || exit 1"],
      interval: "300 seconds",
      timeout: "30 seconds",
      retries: 3,
      startPeriod: "60 seconds",
    },
    environment: {
      DATABASE_URL: $interpolate`postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`,
      RPC_URL: rpcUrl,
      POLLING_INTERVAL: "1000",
      MAX_REQUESTS_PER_SECOND: "20",
      NETWORK: "ethereum",
      DAO_ID: "ENS",
      CHAIN_ID: "1",
      NODE_ENV: $dev ? "development" : "production",
      PONDER_LOG_LEVEL: "debug",
    },
    image: {
      context: "../..",
      dockerfile: "apps/indexer/Dockerfile.indexer",
    },
    dev: {
      command: "pnpm -w indexer dev --config config/ens.config.ts",
    },
  });
}
