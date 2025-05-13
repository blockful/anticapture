import dotenv from "dotenv";

import { processConfig } from '@graphql-mesh/config'

dotenv.config();

export default processConfig({
  sources: [
    ...Object.entries(process.env)
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
                source: `${value}/docs/json`,
              }
            }
          }
        ];
      }),
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


