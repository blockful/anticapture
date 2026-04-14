import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { formatEther, type PublicClient } from "viem";

import { RelayerSigner } from "@/signer/types";

const HealthResponseSchema = z
  .object({
    status: z.enum(["healthy", "degraded"]),
    relayerAddress: z.string(),
    balance: z.string().openapi({ description: "Balance in ETH" }),
    belowThreshold: z.boolean(),
  })
  .openapi("HealthResponse");

export function health(
  app: Hono,
  signer: RelayerSigner,
  publicClient: PublicClient,
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
      return c.json(
        {
          status: (belowThreshold ? "degraded" : "healthy") as
            | "healthy"
            | "degraded",
          relayerAddress: signer.address,
          balance: formatEther(balance),
          belowThreshold,
        },
        200,
      );
    },
  );
}
