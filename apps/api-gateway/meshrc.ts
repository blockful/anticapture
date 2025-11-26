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
      type AverageDelegationPercentageItem {
        date: String!
        high: String!
      }

      type PageInfo {
        hasNextPage: Boolean!
        hasPreviousPage: Boolean!
        endDate: String
        startDate: String
      }

      type AverageDelegationPercentagePage {
        items: [AverageDelegationPercentageItem!]!
        """
        The actual number of items returned in this response.
        May be less than requested if DAOs don't have overlapping data for the full date range.
        """
        totalCount: Int!
        pageInfo: PageInfo!
      }

      type DAOList {
        items: [dao_200_response!]!
        totalCount: Int!
      }

      extend type Query {
        """
        Average delegation percentage across all supported DAOs by day.
        Returns the mean delegation percentage for each day in the specified range.
        Only includes dates where ALL DAOs have data available.
        """
        averageDelegationPercentageByDay(
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
        ): AverageDelegationPercentagePage!

        """
        Get all DAOs
        """
        daos: DAOList!
      }
    `,
    additionalResolvers: ["src/resolvers/index"],
  },
  {
    dir: __dirname,
  },
);
