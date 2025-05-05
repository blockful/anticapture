import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";

const app = new Hono();
// Use the middleware to serve Swagger UI at /ui
app.get("/docs", swaggerUI({ url: "/docs/json" }));

app.get("/docs/json", (c) => {
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
        name: "Token Distribution",
        description: "Gets the information about DAO token distribution",
      },
      {
        name: "Governance Activity",
        description: "Gets the information about DAO governance activity",
      },
    ],
    paths: {
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
          tags: ["Token Distribution"],
          summary: "Get total assets",
          description: "Get total assets of a DAO",
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
      "/dao/{daoId}/voting-power": {
        get: {
          tags: ["Token Distribution"],
          summary: "Get voting power",
          description: "Returns the total voting power of the specified accounts for a DAO",
          operationId: "getVotingPower",
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
              name: "accounts",
              in: "query",
              description: "Ethereum addresses to check voting power for (can be single or multiple)",
              required: true,
              explode: true,
              schema: {
                type: "array",
                items: {
                  type: "string",
                  format: "address",
                  example: "0x1234567890123456789012345678901234567890",
                },
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      votingPower: {
                        type: "string",
                        example: "1000000000000000000000",
                      },
                    },
                  },
                },
              },
            },
            "404": {
              description: "No data found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "No data found",
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
              example: "UNI",
              description: "Unique identifier for the DAO"
            },
            proposalThreshold: {
              type: "string",
              example: "1000000000000000000000000",
              description: "Minimum voting power needed to create a proposal (in wei)"
            },
            votingDelay: {
              type: "string",
              example: "13140",
              description: "Delay between proposal submission and voting start"
            },
            votingPeriod: {
              type: "string",
              example: "40320",
              description: "Duration of voting period (in blocks)"
            },
            quorum: {
              type: "string",
              example: "1000000000000000000000000",
              description: "Minimum number of votes required for a proposal to pass"
            },
            timelockDelay: {
              type: "string",
              example: "172800",
              description: "Time delay before execution after a proposal is approved"
            }
          },
        },
        TotalSupplyCompare: {
          type: "object",
          properties: {
            oldTotalSupply: {
              type: "string",
              example: "1000000000000000000000000000",
            },
            currentTotalSupply: {
              type: "string",
              example: "1000000000000000000000000000",
            },
            changeRate: {
              type: "string",
              example: "-0.010674419057579838",
            },
          },
        },
        DelegatedSupplyCompare: {
          type: "object",
          properties: {
            oldDelegatedSupply: {
              type: "string",
              example: "204890444468088551324035469",
            },
            currentDelegatedSupply: {
              type: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        CirculatingSupplyCompare: {
          type: "object",
          properties: {
            oldCirculatingSupply: {
              type: "string",
              example: "204890444468088551324035469",
            },
            currentCirculatingSupply: {
              type: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        CexSupplyCompare: {
          type: "object",
          properties: {
            oldCexSupply: {
              type: "string",
              example: "204890444468088551324035469",
            },
            currentCexSupply: {
              type: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        DexSupplyCompare: {
          type: "object",
          properties: {
            oldDexSupply: {
              type: "string",
              example: "204890444468088551324035469",
            },
            currentDexSupply: {
              type: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        LendingSupplyCompare: {
          type: "object",
          properties: {
            oldLendingSupply: {
              type: "string",
              example: "204890444468088551324035469",
            },
            currentLendingSupply: {
              type: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        TreasuryCompare: {
          type: "object",
          properties: {
            oldTreasury: {
              type: "string",
              example: "204890444468088551324035469",
            },
            currentTreasury: {
              type: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        ActiveSupplyCompare: {
          type: "object",
          properties: {
            oldActiveSupply: {
              type: "string",
              example: "204890444468088551324035469",
            },
            currentActiveSupply: {
              type: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        ProposalsCompare: {
          type: "object",
          properties: {
            oldProposalsLaunched: {
              type: "string",
              example: "30",
            },
            currentProposalsLaunched: {
              type: "string",
              example: "60",
            },
            changeRate: {
              type: "string",
              example: "1",
            },
          },
        },
        VotesCompare: {
          type: "object",
          properties: {
            oldVotes: {
              type: "string",
              example: "1000",
            },
            currentVotes: {
              type: "string",
              example: "3000",
            },
            changeRate: {
              type: "string",
              example: "2",
            },
          },
        },
        AverageTurnoutCompare: {
          type: "object",
          properties: {
            oldVotes: {
              type: "string",
              example: "204890444468088551324035469",
            },
            currentVotes: {
              type: "string",
              example: "202730905627735664105258518",
            },
            changeRate: {
              type: "string",
              example: "-0.010539968547382565",
            },
          },
        },
        TotalAssets: {
          type: "object",
          properties: {
            totalAssets: {
              type: "string",
              example: "124483516.95437849",
            },
            date: {
              type: "string",
              example: "2025-02-12",
            },
          },
        },
        PetitionSignatures: {
          type: "object",
          properties: {
            petitionSignatures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  accountId: {
                    type: "string",
                    example: "0x1234567890123456789012345678901234567890",
                  },
                  daoId: {
                    type: "string",
                    example: "UNI",
                  },
                  timestamp: {
                    type: "string",
                    example: "2025-02-12",
                  },
                  message: {
                    type: "string",
                    example: "This is a message",
                  },
                  signature: {
                    type: "string",
                    example: "0x1234567890123456789012345678901234567890",
                  },
                },
              },
            },
            totalSignatures: {
              type: "number",
              format: "number",
              example: 100,
            },
            totalSignaturesPower: {
              type: "number",
              format: "number",
              example: 100,
            },
            latestVoters: {
              type: "array",
              items: {
                type: "string",
                example: "0x1234567890123456789012345678901234567890",
              },
            },
            userSigned: {
              type: "boolean",
              format: "boolean",
              example: true,
            },
          },
        },
        PetitionSignature: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              example: "0x1234567890123456789012345678901234567890",
            },
            message: {
              type: "string",
              example: "This is a message",
            },
            signature: {
              type: "string",
              example: "0x1234567890123456789012345678901234567890",
            },
            daoId: {
              type: "string",
              example: "UNI",
            },
            timestamp: {
              type: "string",
              example: "2025-02-12",
            },
          },
        },
      },
    },
  });
});

export default app;
