import { z } from "@hono/zod-openapi";

export const BalanceResponseSchema = z
  .object({
    hasEnoughBalance: z.boolean().openapi({
      description:
        "True when the relayer wallet's native balance is at or above the configured threshold.",
    }),
    balanceWei: z.string().openapi({
      format: "int64",
      description:
        "Current native balance of the relayer wallet, as a decimal string (uint256, in wei).",
    }),
    thresholdWei: z.string().openapi({
      format: "int64",
      description:
        "Minimum native balance the relayer must hold to be considered funded, as a decimal string (uint256, in wei).",
    }),
  })
  .openapi("RelayerBalanceResponse");
