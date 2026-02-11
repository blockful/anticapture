import { Address, getAddress, isAddress } from "viem";
import { z } from "@hono/zod-openapi";
import { PeriodResponseSchema, TimestampResponseMapper } from "../shared";
import { PERCENTAGE_NO_BASELINE } from "../constants";

export const AccountBalanceVariationsByAccountIdRequestParamsSchema = z.object({
  address: z
    .string()
    .refine(isAddress, "Invalid address")
    .transform((addr) => getAddress(addr))
});

export const AccountBalanceVariationsByAccountIdRequestQuerySchema = z.object({
  fromDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
  toDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
});

export const AccountBalanceVariationsRequestQuerySchema =
  AccountBalanceVariationsByAccountIdRequestQuerySchema.extend({
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
    addresses: z
      .union([
        z
          .string()
          .refine(isAddress, "Invalid address")
          .transform((addr) => [getAddress(addr)]),
        z.array(
          z
            .string()
            .refine(isAddress, "Invalid addresses")
            .transform((addr) => getAddress(addr)),
        ),
      ])
      .optional(),
  });

export const AccountBalanceVariationSchema = z.object({
  accountId: z.string(),
  previousBalance: z.string(),
  currentBalance: z.string(),
  absoluteChange: z.string(),
  percentageChange: z.string(),
});

export const AccountBalanceVariationsByAccountIdResponseSchema = z.object({
  period: PeriodResponseSchema,
  data: AccountBalanceVariationSchema,
});

export const AccountBalanceVariationsResponseSchema = z.object({
  period: PeriodResponseSchema,
  items: z.array(AccountBalanceVariationSchema),
});

export type AccountBalanceVariationsResponse = z.infer<
  typeof AccountBalanceVariationsResponseSchema
>;

export type AccountBalanceVariationResponse = z.infer<
  typeof AccountBalanceVariationsByAccountIdResponseSchema
>;

export type AccountBalanceVariation = z.infer<
  typeof AccountBalanceVariationSchema
>;

export type DBAccountBalanceVariation = {
  accountId: Address;
  previousBalance: bigint;
  currentBalance: bigint;
  absoluteChange: bigint;
  percentageChange: string;
};

export const AccountBalanceVariationMapper = (
  variation: DBAccountBalanceVariation,
): AccountBalanceVariation => ({
  accountId: variation.accountId,
  previousBalance: variation.previousBalance.toString(),
  currentBalance: variation.currentBalance.toString(),
  absoluteChange: variation.absoluteChange.toString(),
  percentageChange: (!variation.previousBalance && variation.currentBalance)
    ? PERCENTAGE_NO_BASELINE
    : variation.percentageChange.toString()
});

export const AccountBalanceVariationsByAccountIdResponseMapper = (
  variation: DBAccountBalanceVariation,
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): AccountBalanceVariationResponse => {
  return AccountBalanceVariationsByAccountIdResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    data: AccountBalanceVariationMapper(variation),
  });
};

export const AccountBalanceVariationsResponseMapper = (
  variations: DBAccountBalanceVariation[],
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): AccountBalanceVariationsResponse => {
  return AccountBalanceVariationsResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    items: variations.map(AccountBalanceVariationMapper),
  });
};
