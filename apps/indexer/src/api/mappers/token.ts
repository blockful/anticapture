import { z } from "@hono/zod-openapi";
import { token } from "ponder:schema";

export const TokenPropertiesSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  decimals: z.number(),
  totalSupply: z.string(),
  delegatedSupply: z.string(),
  cexSupply: z.string(),
  dexSupply: z.string(),
  lendingSupply: z.string(),
  circulatingSupply: z.string(),
  treasury: z.string(),
});

export const TokenPropertiesResponseSchema = TokenPropertiesSchema.extend({
  price: z.number(),
});

export type TokenPropertiesResponse = z.infer<
  typeof TokenPropertiesResponseSchema
>;

export type DBToken = typeof token.$inferSelect;

export const TokenMapper = {
  toApi: (dbToken: DBToken, tokenPrice: number): TokenPropertiesResponse => {
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
