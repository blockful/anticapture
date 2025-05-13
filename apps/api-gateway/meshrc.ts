import dotenv from "dotenv";

import { processConfig } from '@graphql-mesh/config'

dotenv.config();

export default processConfig({
  sources: [
    {
      name: `rest_ENS`,
      handler: {
        openapi: {
          source: `${process.env.DAO_API_ENS!}/docs/json`,
        },
      }
    },
    {
      name: `graphql_ENS`,
      handler: {
        graphql: {
          endpoint: process.env.DAO_API_ENS!,
        }
      }
    },
    {
      name: `graphql_UNI`,
      handler: {
        graphql: {
          endpoint: process.env.DAO_API_UNI!,
        }
      }
    },
    {
      name: `rest_UNI`,
      handler: {
        openapi: {
          source: `${process.env.DAO_API_UNI!}/docs/json`,
        }
      }
    },
    ...(process.env.PETITION_API_URL
      ? [
        {
          name: 'petition',
          handler: {
            openapi: {
              source: `${process.env.PETITION_API_URL}`,
            }
          }
        }
      ] : []),
  ],
  additionalResolvers: [
    "src/resolvers/index.ts",
  ]
},
  {
    dir: __dirname,
  },
)


