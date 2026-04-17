import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { formatEther } from "viem";

import { RelayerSigner } from "@/signer/types";
import type { ChainReader } from "@/services/chain/chain-reader";
import { HealthResponseSchema } from "@/schemas/health";

export function health(
  app: Hono,
  signer: RelayerSigner,
  publicClient: ChainReader,
  minBalanceWei: bigint,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "health",
      path: "/health",
      summary: "Relayer health check",
      description: "Returns relayer status and wallet balance",
      tags: ["system"],
      responses: {
        200: {
          description: "Health status",
          content: {
            "application/json": { schema: HealthResponseSchema },
          },
        },
      },
    }),
    async (c) => {
      const balance = await publicClient.getBalance({
        address: signer.address,
      });
      const belowThreshold = balance < minBalanceWei;
      const status: "healthy" | "balance_below_threshold" = belowThreshold
        ? "balance_below_threshold"
        : "healthy";
      return c.json(
        {
          status,
          relayerAddress: signer.address,
          balance: formatEther(balance),
          belowThreshold,
        },
        200,
      );
    },
  );
}
