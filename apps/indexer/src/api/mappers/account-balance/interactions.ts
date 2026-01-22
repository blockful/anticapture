import { z } from "@hono/zod-openapi";
import { isAddress } from "viem";
import { PeriodResponseSchema, TimestampResponseMapper } from "../shared";
import { DBAccountBalanceVariation } from "./variations";
import { DaysEnum } from "@/lib/enums";

export const AccountInteractionsParamsSchema = z.object({
  address: z.string().refine(isAddress, "Invalid address"),
});

export const AccountInteractionsQuerySchema = z.object({
  fromDate: z
    .string()
    .optional()
    .transform((val) =>
      Number(
        val ?? (Math.floor(Date.now() / 1000) - DaysEnum["90d"]).toString(),
      ),
    ),
  toDate: z
    .string()
    .optional()
    .transform((val) =>
      Number(val ?? Math.floor(Date.now() / 1000).toString()),
    ),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(20),
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  minAmount: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  maxAmount: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  orderBy: z.enum(["volume", "count"]).optional().default("count"),
  filterAddress: z.string().refine(isAddress, "Invalid address").optional(),
});

export const AccountInteractionResponseSchema = z.object({
  accountId: z.string(),
  amountTransferred: z.string(),
  totalVolume: z.string(),
  transferCount: z.string(),
});

export const AccountInteractionsResponseSchema = z.object({
  period: PeriodResponseSchema,
  totalCount: z.number(),
  items: z.array(AccountInteractionResponseSchema),
});

export type AccountInteractionsResponse = z.infer<
  typeof AccountInteractionsResponseSchema
>;

export type DBAccountInteraction = DBAccountBalanceVariation & {
  totalVolume: bigint;
  transferCount: bigint;
};

export interface AccountInteractions {
  interactionCount: number;
  interactions: DBAccountInteraction[];
}

export const AccountInteractionsMapper = (
  interactions: AccountInteractions,
  startTimestamp: number,
  endTimestamp: number,
): AccountInteractionsResponse => {
  return AccountInteractionsResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    totalCount: interactions.interactionCount,
    items: interactions.interactions.map(
      ({ accountId, absoluteChange, totalVolume, transferCount }) => ({
        accountId: accountId,
        amountTransferred: absoluteChange.toString(),
        totalVolume: totalVolume.toString(),
        transferCount: transferCount.toString(),
      }),
    ),
  });
};
