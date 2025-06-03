import dotenv from "dotenv";
import { Resource } from "sst";

import { processConfig } from '@graphql-mesh/config'

dotenv.config();

console.log({ Resource })

const env =
  process.env.NODE_ENV === "local"
    ? process.env
    : {
      ...Object.entries(Resource)
        .filter(([key]) => key.endsWith('-indexer-api'))
        .reduce((acc, [key, value]) => ({
          ...acc,
          [`DAO_API_${key.split('-')[0].toUpperCase()}`]: value.url
        }), {}),
    }

export default processConfig({
  sources: [
    ...Object.entries(env)
      .filter(([key]) => key.startsWith('DAO_API_'))
      .flatMap(([key, value]) => {
        if (!value) return [];

        const daoName = key.replace('DAO_API_', '');
        return [
          {
            name: `graphql_${daoName}`,
            handler: {
              graphql: {
                endpoint: value,
              }
            }
          },
          {
            name: `rest_${daoName}`,
            handler: {
              openapi: {
                source: `${value}/docs`,
              }
            }
          }
        ];
      }),
  ],
  additionalResolvers: [
    "src/resolvers/index",
  ]
},
  {
    dir: __dirname,
  },
)


