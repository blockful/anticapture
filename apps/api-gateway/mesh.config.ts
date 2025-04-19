import { defineConfig, loadGraphQLHTTPSubgraph } from '@graphql-mesh/compose-cli'

import { gatewayUrls } from './src/env'

export const composeConfig = defineConfig({
  subgraphs: Object.entries(gatewayUrls).map(([key, url]) => ({
    sourceHandler: loadGraphQLHTTPSubgraph(key, {
      endpoint: url,
    })
  }))
})