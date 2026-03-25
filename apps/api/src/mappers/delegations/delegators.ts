import { z } from "@hono/zod-openapi";
import { Address, getAddress, isAddress } from "viem";

import { OrderDirectionSchema } from "../shared";

export type AggregatedDelegator = {
  delegatorAddress: Address;
  amount: bigint;
  timestamp: bigint;
};

export const DelegatorsRequestParamsSchema = z
  .object({
    address: z
      .string()
      .refine((val) => isAddress(val, { strict: false }))
      .transform((val) => getAddress(val)),
  })
  .openapi("DelegatorsRequestParams", {
    description: "Path params for fetching delegators of a delegate address.",
  });

export const DelegatorsRequestQuerySchema = z
  .object({
    skip: z.coerce
      .number()
      .int()
      .min(0, "Skip must be a non-negative integer")
      .optional()
      .default(0),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be a positive integer")
      .max(100, "Limit cannot exceed 100")
      .optional()
      .default(10),
    orderBy: z.enum(["amount", "timestamp"]).optional().default("amount"),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
  })
  .openapi("DelegatorsRequestQuery", {
    description:
      "Query params used to page and sort delegators for a delegate address.",
  });

export type DelegatorsRequestQuery = z.infer<
  typeof DelegatorsRequestQuerySchema
>;

export const DelegatorItemSchema = z
  .object({
    delegatorAddress: z
      .string()
      .refine((val) => isAddress(val, { strict: false }))
      .transform((val) => getAddress(val)),
    amount: z
      .union([z.bigint().transform((val) => val.toString()), z.string()])
      .openapi({ type: "string" }),
    timestamp: z
      .union([z.bigint().transform((val) => val.toString()), z.string()])
      .openapi({ type: "string" }),
  })
  .openapi("DelegatorItem", {
    description:
      "Aggregated delegation amount and latest timestamp for one delegator.",
  });

export const DelegatorsResponseSchema = z
  .object({
    items: z.array(DelegatorItemSchema),
    totalCount: z.number().int(),
  })
  .openapi("DelegatorsResponse", {
    description: "Paginated delegators for a delegate address.",
  });

export type DelegatorItem = z.infer<typeof DelegatorItemSchema>;
export type DelegatorsResponse = z.infer<typeof DelegatorsResponseSchema>;
