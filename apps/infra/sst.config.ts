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

    const ethereumRpc = new sst.Secret("EthereumRPC", "http://localhost:8545")
    newIndexer(cluster, db, ethereumRpc.value)
    const indexerAPI = newIndexerAPI(cluster, db, ethereumRpc.value)
    newGateway(cluster, [indexerAPI])
  },
});
