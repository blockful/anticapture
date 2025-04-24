import dotenv from "dotenv";
import { defineConfig, loadGraphQLHTTPSubgraph, MeshComposeCLISubgraphConfig } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'

dotenv.config();

const subgraphs: MeshComposeCLISubgraphConfig[] = [
  ...Object.entries(process.env).reduce((acc, [key, value]) => {
    const [match, network] = key.match(/^DAO_API_(\w+)/) || []
    if (!match) return acc
    return [...acc, {
      sourceHandler: loadGraphQLHTTPSubgraph(network, {
        endpoint: value!,
      })
    }]
  }, [] as MeshComposeCLISubgraphConfig[])
]

if (process.env.PETITION_API_URL) {
  subgraphs.push({
    sourceHandler: loadOpenAPISubgraph("Petition", {
      source: process.env.PETITION_API_URL,
    }),
  })
}

export const composeConfig = defineConfig({
  subgraphs
})