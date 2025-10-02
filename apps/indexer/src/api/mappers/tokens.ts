import { z } from "@hono/zod-openapi";
import {
  CoingeckoTokenPriceCompareData,
  CoingeckoTokenPriceCompareDataSchema,
} from "../services/coingecko/types";
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
  price: CoingeckoTokenPriceCompareDataSchema,
});

export type TokenPropertiesResponse = z.infer<
  typeof TokenPropertiesResponseSchema
>;

export type DBToken = typeof token.$inferSelect;

export const TokensMapper = {
  toApi: (
    props: DBToken,
    price: CoingeckoTokenPriceCompareData,
  ): TokenPropertiesResponse => {
    return {
      ...props,
      totalSupply: props.totalSupply.toString(),
      delegatedSupply: props.delegatedSupply.toString(),
      cexSupply: props.cexSupply.toString(),
      dexSupply: props.dexSupply.toString(),
      lendingSupply: props.lendingSupply.toString(),
      circulatingSupply: props.circulatingSupply.toString(),
      treasury: props.treasury.toString(),
      price: price,
    };
  },
};
