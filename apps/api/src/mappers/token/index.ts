import { z } from "@hono/zod-openapi";

import { token } from "@/database";

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
  .openapi("TokenHistoricalPriceRequest");

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
  .openapi("TokenHistoricalPriceResponse");

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
    treasury: z.string(),
  })
  .openapi("TokenProperties");

export const TokenPropertiesResponseSchema = TokenPropertiesSchema.extend({
  price: z.string(),
}).openapi("TokenPropertiesResponse");

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
      treasury: dbToken.treasury.toString(),
      price: tokenPrice,
    };
  },
};
