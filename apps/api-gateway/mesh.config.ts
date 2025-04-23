import dotenv from "dotenv";
import { defineConfig, loadGraphQLHTTPSubgraph, MeshComposeCLISubgraphConfig } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'

dotenv.config();

export const composeConfig = defineConfig({
  subgraphs: [
    ...Object.entries(process.env).reduce((acc, [key, value]) => {
      const [match, network] = key.match(/^DAO_API_(\w+)/) || []
      if (!match) return acc
      return [...acc, {
        sourceHandler: loadGraphQLHTTPSubgraph(network, {
          endpoint: value!,
        })
      }]
    }, [] as MeshComposeCLISubgraphConfig[]),
    {
      sourceHandler: loadOpenAPISubgraph("Petition", {
        source: "https://dev.api.anticapture.com/doc-json",
      }),
    },
  ]
})