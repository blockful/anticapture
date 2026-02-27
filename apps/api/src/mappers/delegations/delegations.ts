import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { delegation } from "@/database";

export type DBDelegation = typeof delegation.$inferSelect;

export const DelegationsRequestParamsSchema = z.object({
  address: z
    .string()
    .refine((val) => isAddress(val, { strict: false }))
    .transform((val) => getAddress(val)),
});
