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
          return {stage: "dev"}
        }
      }
    }
  },
  async run() {
    const { newDatabase } = await import("./src/database.ts");
    const { newIndexer, newIndexerAPI } = await import("./src/indexer/index.ts");

    const { cluster } = await import("./src/cluster.ts");

    const ethereumRpc = new sst.Secret("EthereumRPC", "http://localhost:8545")

    const { execSync } = await import('child_process');
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commitHash = execSync('git rev-parse --short=8 HEAD', { encoding: 'utf8' }).trim();
    const schema = `${commitHash}:${currentBranch}`;

    const duneApiUrl = new sst.Secret("DuneAPIUrl")
    const duneApiKey = new sst.Secret("DuneAPIKey")
    const coingeckoApiKey = new sst.Secret("CoingeckoAPIKey")

    const apis = []
    for (const dao of daos) {
      const db = newDatabase(dao.name, dao.size)
      newIndexer(dao.name, cluster, db, $dev ? "http://localhost:8545" : ethereumRpc.value, schema)
      const indexerAPI = newIndexerAPI(
        dao.name,
        cluster,
        db,
        ethereumRpc.value,
        schema,
        {
          DUNE_API_URL: duneApiUrl?.value,
          DUNE_API_KEY: duneApiKey?.value,
          COINGECKO_API_KEY: coingeckoApiKey?.value,
        }
      )
      apis.push(indexerAPI)
    }

    const { newGateway } = await import("./src/gateway.ts");
    newGateway(cluster, apis)
  },
});
