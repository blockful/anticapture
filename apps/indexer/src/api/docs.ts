import { swaggerUI } from "@hono/swagger-ui";
import { ponder } from "ponder:registry";

// Use the middleware to serve Swagger UI at /ui
ponder.hono.get("/docs", swaggerUI({ url: "/doc-json" }));

ponder.hono.get("/doc-json", (c) => {
  return c.json({
    openapi: "3.0.2",
    info: {
      title: "Swagger Anticapture Server",
      description:
        "Anticapture is an application with the purpose of analyze and warn the main governance risks of each DAO",
      termsOfService: "",
      contact: {
        email: "",
      },
      license: {
        name: "",
        url: "",
      },
      version: "",
    },
    externalDocs: {
      description: "Anticapture Monorepo",
      url: "https://github.com/blockful-io/anticapture",
    },
    servers: [
      {
        url: "http://localhost:42069",
      },
      {
        url: "https://api.anticapture.com",
      },
      {
        url: "https://staging.api.anticapture.com",
      },
    ],
    tags: [
      {
        name: "DAO",
        description: "Lists each DAO",
      },
      {
        name: "Token Distribution",
        description: "Gets the information about DAO token distribution",
      },
      {
        name: "Governance Activity",
        description: "Gets the information about DAO governance activity",
      },
      {
        name: "Dune",
        description: "Gets the information from external source Dune API",
      },
    ],
    paths: {
      "/dao": {
        get: {
          tags: ["DAO"],
          summary: "Returns all DAOs",
          description: "Returns an object of each DAO with basic information",
          operationId: "getDaos",
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/DAO",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/:daoId": {
        get: {
          tags: ["DAO"],
          summary: "Finds a specific DAO by id",
          description: "Provides a specific DAO by it's id",
          operationId: "getDaoById",
          parameters: [
            {
              name: "daoId",
              in: "param",
              description: "Dao ID (ex: UNI, ENS, ...)",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["UNI", "ENS"],
              },
            },
          ],
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/json": {
                  schema: {
                    items: {
                      $ref: "#/components/schemas/DAO",
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid Dao ID",
            },
          },
        },
      },
      "/dao/{daoId}/total-supply/compare": {
        get: {
          tags: ["Token Distribution"],
          summary: "Compare total supply",
          description: "Compares the old and current total supply for a DAO",
          operationId: "compareTotalSupply",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "DAO ID (e.g., UNI, ENS)",
              required: true,
              schema: {
                type: "string",
                example: "UNI",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TotalSupplyCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/delegated-supply/compare": {
        get: {
          tags: ["Token Distribution"],
          summary: "Compare delegated supply",
          description:
            "Compares the old and current delegated supply for a DAO",
          operationId: "compareDelegatedSupply",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "DAO ID (e.g., UNI, ENS)",
              required: true,
              schema: {
                type: "string",
                example: "UNI",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/DelegatedSupplyCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/circulating-supply/compare": {
        get: {
          tags: ["Token Distribution"],
          summary: "Compare circulating supply",
          description:
            "Compares the old and current circulating supply for a DAO",
          operationId: "compareCirculatingSupply",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "DAO ID (e.g., UNI, ENS)",
              required: true,
              schema: {
                type: "string",
                example: "UNI",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CirculatingSupplyCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/cex-supply/compare": {
        get: {
          tags: ["Token Distribution"],
          summary: "Compare CEX supply",
          description:
            "Compares the old and current supply on centralized exchanges (CEX) for a DAO",
          operationId: "compareCexSupply",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "DAO ID (e.g., UNI, ENS)",
              required: true,
              schema: {
                type: "string",
                example: "UNI",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CexSupplyCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/dex-supply/compare": {
        get: {
          tags: ["Token Distribution"],
          summary: "Compare DEX supply over time",
          description:
            "Returns the comparison of DEX supply for a DAO over two time points",
          operationId: "compareDexSupply",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "Dao ID",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/DexSupplyCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/lending-supply/compare": {
        get: {
          tags: ["Token Distribution"],
          summary: "Compare lending supply over time",
          description:
            "Returns the comparison of lending supply for a DAO over two time points",
          operationId: "compareLendingSupply",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "Dao ID",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LendingSupplyCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/treasury/compare": {
        get: {
          tags: ["Token Distribution"],
          summary: "Compare treasury over time",
          description:
            "Returns the comparison of treasury values for a DAO over two time points",
          operationId: "compareTreasury",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "Dao ID",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TreasuryCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/active-supply/compare": {
        get: {
          tags: ["Governance Activity"],
          summary: "Compare active supply over time",
          description:
            "Returns the comparison of active supply for a DAO over two time points",
          operationId: "compareActiveSupply",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "Dao ID",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ActiveSupplyCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/votes/compare": {
        get: {
          tags: ["Governance Activity"],
          summary: "Compare votes over time",
          description:
            "Returns the comparison of votes for a DAO over two time points",
          operationId: "compareVotes",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "Dao ID",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/VotesCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/proposals/compare": {
        get: {
          tags: ["Governance Activity"],
          summary: "Compare proposals over time",
          description:
            "Returns the comparison of proposals launched for a DAO over two time points",
          operationId: "compareProposals",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "Dao ID",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ProposalsCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/average-turnout/compare": {
        get: {
          tags: ["Governance Activity"],
          summary: "Compare average turnout over time",
          description:
            "Returns the comparison of average voter turnout for a DAO over two time points",
          operationId: "compareAverageTurnout",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "Dao ID",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "days",
              in: "query",
              description: "Days interval to be calculated upon",
              required: true,
              explode: false,
              schema: {
                type: "string",
                enum: ["7d", "30d", "90d", "365d"],
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AverageTurnoutCompare",
                  },
                },
              },
            },
          },
        },
      },
      "/dao/{daoId}/total-assets": {
        get: {
          tags: ["Dune"],
          summary: "Get total assets",
          description: "Get total assets of a DAO from Dune API",
          operationId: "getTotalAssets",
          parameters: [
            {
              name: "daoId",
              in: "path",
              description: "Dao ID",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/TotalAssets",
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid Dao ID",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        example: "Not Supported for this DAO",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        DAO: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "string",
              example: "UNI",
            },
            proposalThreshold: {
              type: "string",
              format: "string",
              example: "1000000000000000000000000",
            },
            votingDelay: {
              type: "string",
              format: "string",
              example: "13140",
            },
            votingPeriod: {
              type: "string",
              format: "string",
              example: "40320",
            },
            quorum: {
              type: "string",
              format: "string",
              example: "40000000000000000000000000",
            },
            timelockDelay: {
              type: "string",
              format: "string",
              example: "172800",
            },
          },
        },
        TotalSupplyCompare: {
          type: "object",
          properties: {
            oldTotalSupply: {
              type: "string",
              format: "string",
              example: "1000000000000000000000000000",
            },
            currentTotalSupply: {
              type: "string",
              format: "string",
              example: "1000000000000000000000000000",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010674419057579838",
            },
          },
        },
        DelegatedSupplyCompare: {
          type: "object",
          properties: {
            oldDelegatedSupply: {
              type: "string",
              format: "string",
              example: "204890444468088551324035469",
            },
            currentDelegatedSupply: {
              type: "string",
              format: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        CirculatingSupplyCompare: {
          type: "object",
          properties: {
            oldCirculatingSupply: {
              type: "string",
              format: "string",
              example: "204890444468088551324035469",
            },
            currentCirculatingSupply: {
              type: "string",
              format: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        CexSupplyCompare: {
          type: "object",
          properties: {
            oldCexSupply: {
              type: "string",
              format: "string",
              example: "204890444468088551324035469",
            },
            currentCexSupply: {
              type: "string",
              format: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        DexSupplyCompare: {
          type: "object",
          properties: {
            oldDexSupply: {
              type: "string",
              format: "string",
              example: "204890444468088551324035469",
            },
            currentDexSupply: {
              type: "string",
              format: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        LendingSupplyCompare: {
          type: "object",
          properties: {
            oldLendingSupply: {
              type: "string",
              format: "string",
              example: "204890444468088551324035469",
            },
            currentLendingSupply: {
              type: "string",
              format: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        TreasuryCompare: {
          type: "object",
          properties: {
            oldTreasury: {
              type: "string",
              format: "string",
              example: "204890444468088551324035469",
            },
            currentTreasury: {
              type: "string",
              format: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        ActiveSupplyCompare: {
          type: "object",
          properties: {
            oldActiveSupply: {
              type: "string",
              format: "string",
              example: "204890444468088551324035469",
            },
            currentActiveSupply: {
              type: "string",
              format: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        ProposalsCompare: {
          type: "object",
          properties: {
            oldProposalsLaunched: {
              type: "string",
              format: "string",
              example: "30",
            },
            currentProposalsLaunched: {
              type: "string",
              format: "string",
              example: "60",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "1",
            },
          },
        },
        VotesCompare: {
          type: "object",
          properties: {
            oldVotes: {
              type: "string",
              format: "string",
              example: "1000",
            },
            currentVotes: {
              type: "string",
              format: "string",
              example: "3000",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "2",
            },
          },
        },
        AverageTurnoutCompare: {
          type: "object",
          properties: {
            oldVotes: {
              type: "string",
              format: "string",
              example: "204890444468088551324035469",
            },
            currentVotes: {
              type: "string",
              format: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              format: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        TotalAssets: {
          type: "object",
          properties: {
            totalAssets: {
              type: "string",
              format: "string",
              example: "124483516.95437849",
            },
            date: {
              type: "string",
              format: "string",
              example: "2025-02-12",
            },
          },
        },
      },
    },
  });
});
