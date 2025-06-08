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

    const { db } = await import("./src/database.ts");
    const { cluster } = await import("./src/cluster.ts");
    const { newGateway } = await import("./src/gateway.ts");
    const { newIndexer, newIndexerAPI } = await import("./src/indexer/index.ts");

    // const { createDb } = await import("./src/functions/create-db.ts");
    // createDb(db, "ens");

    const ethereumRpc = new sst.Secret("EthereumRPC", "http://localhost:8545")
    newIndexer(cluster, db, $dev ? "http://localhost:8545" : ethereumRpc.value)

    // const indexerAPI = newIndexerAPI(cluster, db, ethereumRpc.value)
    // newGateway(cluster, [indexerAPI])
  },
});
