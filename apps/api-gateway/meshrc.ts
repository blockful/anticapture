import dotenv from "dotenv";

import { processConfig } from "@graphql-mesh/config";

dotenv.config();

export default processConfig(
  {
    serve: {
      cors: {
        origin: "*",
      },
    },
    sources: [
      ...Object.entries(process.env)
        .filter(([key]) => key.startsWith("DAO_API_"))
        .flatMap(([key, value]) => {
          if (!value) return [];

          const daoName = key.replace("DAO_API_", "");
          return [
            {
              name: `graphql_${daoName}`,
              handler: {
                graphql: {
                  endpoint: value,
                },
              },
              transforms: [
                {
                  rename: {
                    renames: [
                      {
                        from: {
                          type: "Query",
                          field: "transactions",
                        },
                        to: {
                          type: "Query",
                          field: "_",
                        },
                      },
                    ],
                  },
                },
              ],
            },
            {
              name: `rest_${daoName}`,
              handler: {
                openapi: {
                  source: `${value}/docs`,
                  endpoint: value,
                },
              },
            },
          ];
        }),
    ],
    additionalTypeDefs:`
      type AggregatedDelegatedSupplyItem {
        date: String!
        high: String!
      }

      type PageInfo {
        hasNextPage: Boolean!
        endDate: String
        startDate: String
      }

      type AggregatedDelegatedSupplyPage {
        items: [AggregatedDelegatedSupplyItem!]!
        totalCount: Int!
        pageInfo: PageInfo!
      }

      extend type Query {
        """
        Aggregated delegation supply across all supported DAOs.
        Returns the mean delegation percentage for each day in the specified range.
        Only includes dates where ALL DAOs have data available.
        """
        aggregatedDelegatedSupply(
          """
          Start date (Unix timestamp in seconds). Required.
          All DAOs will return data starting from this date.
          The aggregation will begin from the latest start date among all DAOs.
          """
          startDate: String!

          """
          End date (Unix timestamp in seconds). Optional.
          If not provided, returns data up to the latest available date.
          """
          endDate: String

          """
          Cursor for pagination. Returns items after this date.
          """
          after: String

          """
          Cursor for pagination. Returns items before this date.
          """
          before: String

          """
          Sort direction: "asc" or "desc". Default: "asc"
          """
          orderDirection: String

          """
          Maximum number of items to return. Default: 100
          """
          limit: Int
        ): AggregatedDelegatedSupplyPage!
      }
    `,
    additionalResolvers: ["src/resolvers/index"],
  },
  {
    dir: __dirname,
  },
);
