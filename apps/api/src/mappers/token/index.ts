import { z } from "@hono/zod-openapi";

import { token } from "@/database";

const TokenDaysWindowSchema = z
  .enum(["7d", "30d", "90d", "180d", "365d"])
  .openapi("DaysWindow");

export const TokenHistoricalPriceRequest = z
  .object({
    skip: z.coerce
      .number()
      .int()
      .min(0, "Skip must be a non-negative integer")
      .optional()
      .default(0)
      .openapi({
        description: "Number of rows to skip before returning results.",
        example: 0,
        type: "integer",
      }),
    limit: z.coerce.number().int().max(365).optional().default(365).openapi({
      description: "Maximum number of historical points to return.",
      example: 365,
      type: "integer",
    }),
  })
  .openapi("TokenHistoricalPriceRequest", {
    description: "Pagination query for historical token market data.",
  });

export type TokenHistoricalPriceRequest = z.infer<
  typeof TokenHistoricalPriceRequest
>;

export const TokenHistoricalPriceItemSchema = z
  .object({
    price: z.string().openapi({
      description: "Historical price value as a decimal string.",
      example: "0.1234",
    }),
    timestamp: z.number().int().openapi({
      description: "Unix timestamp in seconds.",
      example: 1704067200,
      type: "integer",
    }),
  })
  .openapi("TokenHistoricalPriceItem");

export const TokenHistoricalPriceResponse = z
  .array(TokenHistoricalPriceItemSchema)
  .openapi("TokenHistoricalPriceResponse", {
    description: "Historical token price points ordered by timestamp.",
  });

export type TokenHistoricalPriceResponse = z.infer<
  typeof TokenHistoricalPriceResponse
>;

export const TokenPropertiesSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    decimals: z.number().int().openapi({
      description: "Token decimals.",
      example: 18,
      type: "integer",
    }),
    totalSupply: z.string(),
    delegatedSupply: z.string(),
    cexSupply: z.string(),
    dexSupply: z.string(),
    lendingSupply: z.string(),
    circulatingSupply: z.string(),
    nonCirculatingSupply: z.string(),
    treasury: z.string(),
  })
  .openapi("TokenProperties", {
    description:
      "Core token supply and treasury attributes for the active DAO token.",
  });

export const TokenPropertiesResponseSchema = TokenPropertiesSchema.extend({
  price: z.string(),
}).openapi("TokenPropertiesResponse", {
  description: "Token properties enriched with the current token price.",
});

export const TokenDistributionComparisonQuerySchema = z
  .object({
    days: TokenDaysWindowSchema.optional(),
  })
  .openapi("TokenDistributionComparisonQuery", {
    description:
      "Shared query params for token distribution comparison endpoints.",
  });

export const SupplyComparisonResponseSchema = z
  .object({
    previousValue: z.string(),
    currentValue: z.string(),
    changeRate: z.number(),
  })
  .openapi("SupplyComparisonResponse", {
    description:
      "Supply metric comparison between current and previous periods.",
  });

export type TokenPropertiesResponse = z.infer<
  typeof TokenPropertiesResponseSchema
>;

export type DBToken = typeof token.$inferSelect;

export const TokenMapper = {
  toApi: (dbToken: DBToken, tokenPrice: string): TokenPropertiesResponse => {
    return {
      ...dbToken,
      totalSupply: dbToken.totalSupply.toString(),
      delegatedSupply: dbToken.delegatedSupply.toString(),
      cexSupply: dbToken.cexSupply.toString(),
      dexSupply: dbToken.dexSupply.toString(),
      lendingSupply: dbToken.lendingSupply.toString(),
      circulatingSupply: dbToken.circulatingSupply.toString(),
      nonCirculatingSupply: dbToken.nonCirculatingSupply.toString(),
      treasury: dbToken.treasury.toString(),
      price: tokenPrice,
    };
  },
};
