import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { delegation } from "@/database";

import { DelegationItem, DelegationsResponse } from "./historical";

export type DBDelegation = typeof delegation.$inferSelect;

export const DelegationsRequestParamsSchema = z.object({
  address: z
    .string()
    .refine((val) => isAddress(val, { strict: false }))
    .transform((val) => getAddress(val)),
});

export const DelegationsRequestQuerySchema = z.object({
  orderBy: z.enum(["amount", "timestamp"]).optional().default("timestamp"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type DelegationsRequestQuery = z.infer<
  typeof DelegationsRequestQuerySchema
>;
