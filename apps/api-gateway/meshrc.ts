import dotenv from "dotenv";

import { processConfig } from '@graphql-mesh/config'

dotenv.config();

export default processConfig({
  sources: Object.entries(process.env)
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
  additionalResolvers: [
    "src/resolvers/index",
  ]
},
  {
    dir: __dirname,
  },
)


