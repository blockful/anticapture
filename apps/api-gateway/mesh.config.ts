import dotenv from "dotenv";
import { defineConfig, loadGraphQLHTTPSubgraph, MeshComposeCLISubgraphConfig } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'

dotenv.config();

const subgraphs: MeshComposeCLISubgraphConfig[] = [
  ...Object.entries(process.env).reduce((acc, [key, value]) => {
    const [match, chain] = key.match(/^DAO_API_(\w+)/) || []
    if (match) {
      try {
        return [
          ...acc,
          {
            sourceHandler: loadGraphQLHTTPSubgraph(`graphql_${chain}`, {
              endpoint: value!,
            })
          },
          {
            sourceHandler: loadOpenAPISubgraph(`rest_${chain}`, {
              source: `${value!}/docs/json`,
            })
          },
        ]
      } catch (error) {
        console.error({ message: `Unable to load ${chain} DAO API`, error })
      }
    }

    return acc
  }, [] as MeshComposeCLISubgraphConfig[])
]

if (process.env.PETITION_API_URL) {
  try {
    subgraphs.push({
      sourceHandler: loadOpenAPISubgraph("Petition", {
        source: process.env.PETITION_API_URL,
      }),
    })
  } catch (error) {
    console.error({ message: "Unable to load petition API", error })
  }
}

export const composeConfig = defineConfig({
  subgraphs,
})