import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import {
  HistoricalBalancesService,
  HistoricalBalance,
  HistoricalBalancesRequest,
} from "../services/historical-balances";

export function historicalBalances(app: Hono) {
  const service = new HistoricalBalancesService();

  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalBalances",
      path: "/historical-balances/{daoId}",
      summary: "Get historical token balances",
      description:
        "Fetch historical token balances for multiple addresses at a specific block number using multicall",
      tags: ["historical-balances"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
        query: z.object({
          addresses: z.string().min(1, "At least one address is required"),
          blockNumber: z.coerce.number().int().positive("Block number must be positive"),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved historical balances",
          content: {
            "application/json": {
              schema: z.object({
                data: z.array(
                  z.object({
                    address: z.string(),
                    balance: z.string(), // BigInt serialized as string
                    blockNumber: z.number(),
                    tokenAddress: z.string(),
                  }),
                ),
                metadata: z.object({
                  totalAddresses: z.number(),
                  blockNumber: z.number(),
                  daoId: z.string(),
                  tokenAddress: z.string(),
                }),
              }),
            },
          },
        },
        400: {
          description: "Bad request - validation error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                message: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      try {
        const { daoId } = context.req.valid("param");
        const { addresses: addressesStr, blockNumber } = context.req.valid("query");

        // Parse comma-separated addresses
        const addresses = addressesStr.split(',').map(addr => addr.trim()) as Address[];
        
        // Validate addresses
        if (addresses.length === 0) {
          return context.json(
            {
              error: "Validation Error",
              message: "At least one address is required",
            },
            400,
          );
        }
        
        if (addresses.length > 100) {
          return context.json(
            {
              error: "Validation Error", 
              message: "Maximum 100 addresses allowed",
            },
            400,
          );
        }
        
        // Validate address format
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        for (const address of addresses) {
          if (!addressRegex.test(address)) {
            return context.json(
              {
                error: "Validation Error",
                message: `Invalid Ethereum address format: ${address}`,
              },
              400,
            );
          }
        }

        // Additional validation: check if block number is not too far in the future
        const currentBlockNumber = await service.getCurrentBlockNumber();
        if (blockNumber > currentBlockNumber) {
          return context.json(
            {
              error: "Invalid Block Number",
              message: `Block number ${blockNumber} is in the future. Current block is ${currentBlockNumber}`,
            },
            400,
          );
        }

        // Additional validation: check if block number is not too old (optional, can be configured)
        const maxBlocksBack = 1000000; // Allow queries up to ~1M blocks back
        if (blockNumber < currentBlockNumber - maxBlocksBack) {
          return context.json(
            {
              error: "Block Too Old",
              message: `Block number ${blockNumber} is too old. Maximum allowed is ${currentBlockNumber - maxBlocksBack}`,
            },
            400,
          );
        }

        const request: HistoricalBalancesRequest = {
          addresses: addresses,
          blockNumber,
          daoId,
        };

        const balances = await service.getHistoricalBalances(request);

        // Get token address for metadata from the service since we know it exists
        const tokenContract = await service.getTokenContract(daoId);
        const tokenAddress = tokenContract.address;

        const response = {
          data: balances
          metadata: {
            totalAddresses: addresses.length,
            blockNumber,
            daoId,
            tokenAddress,
          },
        };

        return context.json(response, 200);
      } catch (error) {
        console.error("Historical balances endpoint error:", error);

        if (error instanceof Error) {
          // Handle validation errors and specific service errors
          if (
            error.message.includes("Invalid") ||
            error.message.includes("Maximum") ||
            error.message.includes("cannot be empty")
          ) {
            return context.json(
              {
                error: "Validation Error",
                message: error.message,
              },
              400,
            );
          }
        }

        // Handle unexpected errors
        return context.json(
          {
            error: "Internal Server Error",
            message:
              "An unexpected error occurred while fetching historical balances",
          },
          500,
        );
      }
    },
  );
}
