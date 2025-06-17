/// <reference path="../../.sst/platform/config.d.ts" />

import { Output } from "@pulumi/pulumi";

export function newIndexer(
  dao: string,
  cluster: sst.aws.Cluster,
  db: sst.aws.Postgres,
  rpcUrl: Output<string>,
  schema: string,
): sst.aws.Service {
  return new sst.aws.Service(`${dao}Indexer`, {
    cluster,
    memory: "2 GB",
    cpu: "1 vCPU",
    link: [db],
    loadBalancer: {
      public: false,
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
      DAO_ID: dao,
      CHAIN_ID: "1",
      NODE_ENV: $dev ? "development" : "production",
    },
    image: {
      context: "../..",
      dockerfile: "apps/indexer/Dockerfile.indexer",
      args: {
        CONFIG_FILE: `config/${dao.toLowerCase()}.config.ts`,
        SCHEMA: schema
      },
    },
    dev: {
      command: `pnpm -w indexer dev --config config/${dao.toLowerCase()}.config.ts`,
    },
  });
}
