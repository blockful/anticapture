import { swaggerUI } from "@hono/swagger-ui";
import { ponder } from "ponder:registry";

// Use the middleware to serve Swagger UI at /ui
ponder.hono.get("/docs", swaggerUI({ url: "/doc-json" }));

ponder.hono.get("/doc-json", (c) => {
  return c.json({
    openapi: "3.0.2",
    info: {
      title: "Swagger DefenDAO Server",
      description:
        "DefenDAO is an application with the purpose of analyze and warn the main governance risks of each DAO",
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
      description: "DefenDAO Monorepo",
      url: "https://github.com/blockful-io/defendao",
    },
    servers: [
      {
        url: "https://api.defendao.com",
      },
      {
        url: "https://staging.api.defendao.com",
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
      "/dao/:daoId/total-supply/compare": {
        get: {
          tags: ["pet"],
          summary: "Finds Pets by tags",
          description:
            "Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.",
          operationId: "findPetsByTags",
          parameters: [
            {
              name: "tags",
              in: "query",
              description: "Tags to filter by",
              required: false,
              explode: true,
              schema: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
          ],
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/xml": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Pet",
                    },
                  },
                },
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Pet",
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid tag value",
            },
          },
          security: [
            {
              petstore_auth: ["write:pets", "read:pets"],
            },
          ],
        },
      },
      "/pet/{petId}": {
        get: {
          tags: ["pet"],
          summary: "Find pet by ID",
          description: "Returns a single pet",
          operationId: "getPetById",
          parameters: [
            {
              name: "petId",
              in: "path",
              description: "ID of pet to return",
              required: true,
              schema: {
                type: "integer",
                format: "int64",
              },
            },
          ],
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/xml": {
                  schema: {
                    $ref: "#/components/schemas/Pet",
                  },
                },
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Pet",
                  },
                },
              },
            },
            "400": {
              description: "Invalid ID supplied",
            },
            "404": {
              description: "Pet not found",
            },
          },
          security: [
            {
              api_key: [],
            },
            {
              petstore_auth: ["write:pets", "read:pets"],
            },
          ],
        },
        post: {
          tags: ["pet"],
          summary: "Updates a pet in the store with form data",
          description: "",
          operationId: "updatePetWithForm",
          parameters: [
            {
              name: "petId",
              in: "path",
              description: "ID of pet that needs to be updated",
              required: true,
              schema: {
                type: "integer",
                format: "int64",
              },
            },
            {
              name: "name",
              in: "query",
              description: "Name of pet that needs to be updated",
              schema: {
                type: "string",
              },
            },
            {
              name: "status",
              in: "query",
              description: "Status of pet that needs to be updated",
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "405": {
              description: "Invalid input",
            },
          },
          security: [
            {
              petstore_auth: ["write:pets", "read:pets"],
            },
          ],
        },
        delete: {
          tags: ["pet"],
          summary: "Deletes a pet",
          description: "",
          operationId: "deletePet",
          parameters: [
            {
              name: "api_key",
              in: "header",
              description: "",
              required: false,
              schema: {
                type: "string",
              },
            },
            {
              name: "petId",
              in: "path",
              description: "Pet id to delete",
              required: true,
              schema: {
                type: "integer",
                format: "int64",
              },
            },
          ],
          responses: {
            "400": {
              description: "Invalid pet value",
            },
          },
          security: [
            {
              petstore_auth: ["write:pets", "read:pets"],
            },
          ],
        },
      },
      "/pet/{petId}/uploadImage": {
        post: {
          tags: ["pet"],
          summary: "uploads an image",
          description: "",
          operationId: "uploadFile",
          parameters: [
            {
              name: "petId",
              in: "path",
              description: "ID of pet to update",
              required: true,
              schema: {
                type: "integer",
                format: "int64",
              },
            },
            {
              name: "additionalMetadata",
              in: "query",
              description: "Additional Metadata",
              required: false,
              schema: {
                type: "string",
              },
            },
          ],
          requestBody: {
            content: {
              "application/octet-stream": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ApiResponse",
                  },
                },
              },
            },
          },
          security: [
            {
              petstore_auth: ["write:pets", "read:pets"],
            },
          ],
        },
      },
      "/store/inventory": {
        get: {
          tags: ["store"],
          summary: "Returns pet inventories by status",
          description: "Returns a map of status codes to quantities",
          operationId: "getInventory",
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    additionalProperties: {
                      type: "integer",
                      format: "int32",
                    },
                  },
                },
              },
            },
          },
          security: [
            {
              api_key: [],
            },
          ],
        },
      },
      "/store/order": {
        post: {
          tags: ["store"],
          summary: "Place an order for a pet",
          description: "Place a new order in the store",
          operationId: "placeOrder",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Order",
                },
              },
              "application/xml": {
                schema: {
                  $ref: "#/components/schemas/Order",
                },
              },
              "application/x-www-form-urlencoded": {
                schema: {
                  $ref: "#/components/schemas/Order",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Order",
                  },
                },
              },
            },
            "405": {
              description: "Invalid input",
            },
          },
        },
      },
      "/store/order/{orderId}": {
        get: {
          tags: ["store"],
          summary: "Find purchase order by ID",
          description:
            "For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.",
          operationId: "getOrderById",
          parameters: [
            {
              name: "orderId",
              in: "path",
              description: "ID of order that needs to be fetched",
              required: true,
              schema: {
                type: "integer",
                format: "int64",
              },
            },
          ],
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/xml": {
                  schema: {
                    $ref: "#/components/schemas/Order",
                  },
                },
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Order",
                  },
                },
              },
            },
            "400": {
              description: "Invalid ID supplied",
            },
            "404": {
              description: "Order not found",
            },
          },
        },
        delete: {
          tags: ["store"],
          summary: "Delete purchase order by ID",
          description:
            "For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors",
          operationId: "deleteOrder",
          parameters: [
            {
              name: "orderId",
              in: "path",
              description: "ID of the order that needs to be deleted",
              required: true,
              schema: {
                type: "integer",
                format: "int64",
              },
            },
          ],
          responses: {
            "400": {
              description: "Invalid ID supplied",
            },
            "404": {
              description: "Order not found",
            },
          },
        },
      },
      "/user": {
        post: {
          tags: ["user"],
          summary: "Create user",
          description: "This can only be done by the logged in user.",
          operationId: "createUser",
          requestBody: {
            description: "Created user object",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
              "application/xml": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
              "application/x-www-form-urlencoded": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          responses: {
            default: {
              description: "successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
                "application/xml": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
          },
        },
      },
      "/user/createWithList": {
        post: {
          tags: ["user"],
          summary: "Creates list of users with given input array",
          description: "Creates list of users with given input array",
          operationId: "createUsersWithListInput",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/xml": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
            default: {
              description: "successful operation",
            },
          },
        },
      },
      "/user/login": {
        get: {
          tags: ["user"],
          summary: "Logs user into the system",
          description: "",
          operationId: "loginUser",
          parameters: [
            {
              name: "username",
              in: "query",
              description: "The user name for login",
              required: false,
              schema: {
                type: "string",
              },
            },
            {
              name: "password",
              in: "query",
              description: "The password for login in clear text",
              required: false,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "successful operation",
              headers: {
                "X-Rate-Limit": {
                  description: "calls per hour allowed by the user",
                  schema: {
                    type: "integer",
                    format: "int32",
                  },
                },
                "X-Expires-After": {
                  description: "date in UTC when token expires",
                  schema: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
              content: {
                "application/xml": {
                  schema: {
                    type: "string",
                  },
                },
                "application/json": {
                  schema: {
                    type: "string",
                  },
                },
              },
            },
            "400": {
              description: "Invalid username/password supplied",
            },
          },
        },
      },
      "/user/logout": {
        get: {
          tags: ["user"],
          summary: "Logs out current logged in user session",
          description: "",
          operationId: "logoutUser",
          parameters: [],
          responses: {
            default: {
              description: "successful operation",
            },
          },
        },
      },
      "/user/{username}": {
        get: {
          tags: ["user"],
          summary: "Get user by user name",
          description: "",
          operationId: "getUserByName",
          parameters: [
            {
              name: "username",
              in: "path",
              description:
                "The name that needs to be fetched. Use user1 for testing. ",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/xml": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
            "400": {
              description: "Invalid username supplied",
            },
            "404": {
              description: "User not found",
            },
          },
        },
        put: {
          tags: ["user"],
          summary: "Update user",
          description: "This can only be done by the logged in user.",
          operationId: "updateUser",
          parameters: [
            {
              name: "username",
              in: "path",
              description: "name that needs to be updated",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          requestBody: {
            description: "Update an existent user in the store",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
              "application/xml": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
              "application/x-www-form-urlencoded": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          responses: {
            default: {
              description: "successful operation",
            },
          },
        },
        delete: {
          tags: ["user"],
          summary: "Delete user",
          description: "This can only be done by the logged in user.",
          operationId: "deleteUser",
          parameters: [
            {
              name: "username",
              in: "path",
              description: "The name that needs to be deleted",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "400": {
              description: "Invalid username supplied",
            },
            "404": {
              description: "User not found",
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
      },
      requestBodies: {
        Pet: {
          description: "Pet object that needs to be added to the store",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Pet",
              },
            },
            "application/xml": {
              schema: {
                $ref: "#/components/schemas/Pet",
              },
            },
          },
        },
        UserArray: {
          description: "List of user object",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        petstore_auth: {
          type: "oauth2",
          flows: {
            implicit: {
              authorizationUrl: "https://petstore3.swagger.io/oauth/authorize",
              scopes: {
                "write:pets": "modify pets in your account",
                "read:pets": "read your pets",
              },
            },
          },
        },
        api_key: {
          type: "apiKey",
          name: "api_key",
          in: "header",
        },
      },
    },
  });
});
