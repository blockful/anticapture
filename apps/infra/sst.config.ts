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
    const { newDatabase } = await import("./src/database.ts");
    const { newIndexer, newIndexerAPI } = await import("./src/indexer/index.ts");

    const { cluster } = await import("./src/cluster.ts");

    const ethereumRpc = new sst.Secret("EthereumRPC", "http://localhost:8545")

    const db = newDatabase("ENS")
    newIndexer(cluster, db, $dev ? "http://localhost:8545" : ethereumRpc.value)
    const indexerAPI = newIndexerAPI(cluster, db, ethereumRpc.value)

    // const { newGateway } = await import("./src/gateway.ts");
    // newGateway(cluster, [{ service: indexerAPI, dao: "ENS" }])
  },
});
