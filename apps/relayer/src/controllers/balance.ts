import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import type { Address } from "viem";

import { BalanceResponseSchema } from "@/schemas/balance";
import { ErrorResponseSchema } from "@/errors";
import type { ChainReader } from "@/services/chain/chain-reader";

interface BalanceControllerDeps {
  publicClient: ChainReader;
  relayerAddress: Address;
  thresholdWei: bigint;
}

export function balance(app: Hono, deps: BalanceControllerDeps) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRelayerBalance",
      path: "/relay/balance",
      summary: "Relayer wallet funding status",
      description:
        "Returns the relayer wallet's current native balance and whether it meets the configured threshold. " +
        "Lets the dashboard hide or warn about gasless actions before users sign a request.",
      tags: ["system"],
      responses: {
        200: {
          description: "Relayer balance status",
          content: {
            "application/json": { schema: BalanceResponseSchema },
          },
        },
        500: {
          description: "Failed to read on-chain balance",
          content: {
            "application/json": { schema: ErrorResponseSchema },
          },
        },
      },
    }),
    async (c) => {
      const balanceWei = await deps.publicClient.getBalance({
        address: deps.relayerAddress,
      });

      return c.json(
        {
          hasEnoughBalance: balanceWei >= deps.thresholdWei,
          balanceWei: balanceWei.toString(),
          thresholdWei: deps.thresholdWei.toString(),
        },
        200,
      );
    },
  );
}
