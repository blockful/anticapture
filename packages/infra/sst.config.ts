/// <reference path="./.sst/platform/config.d.ts" />

const daos: { name: string; size: `${number}0 GB` }[] = [
  {
    name:"ENS",
    size:"30 GB"
  },
  {
    name:"UNI",
    size:"30 GB"
  },
]

export default $config({
  app(input) {
    return {
      name: "anticapture",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  console: {
    autodeploy: {
      target(event: {type: string, branch: string, action: string, number: number}) {
        if (event.type === "branch" && event.action === "pushed") {
          if (event.branch === "main") return {stage: "production"}
          if (event.branch === "dev") return {stage: "dev"}
          return {stage: `pr-${event.number}`}
        }

        if (event.type === "pull_request") {
          return {stage: `pr-${event.number}`}
        }
      }
    }
  },
  async run() {
    const { newDatabase } = await import("./src/database.ts");
    const { newIndexer, newIndexerAPI } = await import("./src/indexer/index.ts");

    const { cluster } = await import("./src/cluster.ts");

    const ethereumRpc = new sst.Secret("EthereumRPC", "http://localhost:8545")

    const schema = crypto.randomUUID();

    const apis = []
    for (const dao of daos) {
      const db = newDatabase(dao.name, dao.size)
      newIndexer(dao.name, cluster, db, $dev ? "http://localhost:8545" : ethereumRpc.value, schema)
      const indexerAPI = newIndexerAPI(dao.name, cluster, db, ethereumRpc.value, schema)
      apis.push(indexerAPI)
    }

    const { newGateway } = await import("./src/gateway.ts");
    newGateway(cluster, apis)
  },
});
