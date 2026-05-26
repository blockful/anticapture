import dotenv from "dotenv";
import { z } from "zod";

import { isRailwayPreviewEnv } from "../cmd/ci";
import { DaoIdEnum } from "@/lib/enums";

dotenv.config();

const CI = isRailwayPreviewEnv();

const withSearchPath = (val: string) =>
  `${val}?options=-c%20search_path%3Danticapture`;

const duneQueryUrl = (id: string) =>
  `https://api.dune.com/api/v1/query/${id}/results`;

const REVENUE_DUNE_QUERY_ID_KEYS = [
  "REVENUE_DUNE_ACTIONS_QUERY_ID",
  "REVENUE_DUNE_ACTIVE_NAMES_QUERY_ID",
  "REVENUE_DUNE_NEW_WALLETS_QUERY_ID",
  "REVENUE_DUNE_RENEWAL_FUNNEL_QUERY_ID",
  "REVENUE_DUNE_REVENUE_TOTALS_QUERY_ID",
  "REVENUE_DUNE_REVENUE_BY_CATEGORY_QUERY_ID",
  "REVENUE_DUNE_RENEWAL_TENURE_QUERY_ID",
] as const;

const duneQueryId = z
  .string()
  .regex(/^\d+$/, "must be a numeric Dune query ID");

const envSchema = z
  .object({
    RPC_URL: z.string(),
    DATABASE_URL: z.string().transform(withSearchPath),
    DATABASE_PUBLIC_URL: z
      .string()
      .optional()
      .transform((val) => (val ? withSearchPath(val) : undefined)),
    DAO_ID: z.enum(DaoIdEnum),
    CHAIN_ID: z.coerce.number(),

    // Treasury provider configuration
    TREASURY_DATA_PROVIDER_ID: z
      .enum(["DUNE", "DEFILLAMA", "COMPOUND"])
      .optional(),
    TREASURY_DATA_PROVIDER_API_URL: z.string().optional(),
    TREASURY_DATA_PROVIDER_API_KEY: z.string().optional(),

    COINGECKO_API_URL: z.string(),
    COINGECKO_API_KEY: z.string(),
    REDIS_URL: z.string().optional(),
    PORT: z.coerce.number().default(42069),

    // Revenue (ENS-only) Dune configuration
    REVENUE_DUNE_API_KEY: z.string().optional(),
    REVENUE_DUNE_ACTIONS_QUERY_ID: duneQueryId.optional(),
    REVENUE_DUNE_ACTIVE_NAMES_QUERY_ID: duneQueryId.optional(),
    REVENUE_DUNE_NEW_WALLETS_QUERY_ID: duneQueryId.optional(),
    REVENUE_DUNE_RENEWAL_FUNNEL_QUERY_ID: duneQueryId.optional(),
    REVENUE_DUNE_REVENUE_TOTALS_QUERY_ID: duneQueryId.optional(),
    REVENUE_DUNE_REVENUE_BY_CATEGORY_QUERY_ID: duneQueryId.optional(),
    REVENUE_DUNE_RENEWAL_TENURE_QUERY_ID: duneQueryId.optional(),
  })
  .superRefine((data, ctx) => {
    if (CI && !data.DATABASE_PUBLIC_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_PUBLIC_URL"],
        message: "DATABASE_PUBLIC_URL is required in CI environments",
      });
    }
    if (data.REVENUE_DUNE_API_KEY) {
      for (const key of REVENUE_DUNE_QUERY_ID_KEYS) {
        if (!data[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required when REVENUE_DUNE_API_KEY is set`,
          });
        }
      }
    }
  })
  .transform((data) => ({
    ...data,
    DATABASE_URL: CI ? data.DATABASE_PUBLIC_URL! : data.DATABASE_URL,
    REVENUE_DUNE_ACTIONS_URL: data.REVENUE_DUNE_ACTIONS_QUERY_ID
      ? duneQueryUrl(data.REVENUE_DUNE_ACTIONS_QUERY_ID)
      : undefined,
    REVENUE_DUNE_ACTIVE_NAMES_URL: data.REVENUE_DUNE_ACTIVE_NAMES_QUERY_ID
      ? duneQueryUrl(data.REVENUE_DUNE_ACTIVE_NAMES_QUERY_ID)
      : undefined,
    REVENUE_DUNE_NEW_WALLETS_URL: data.REVENUE_DUNE_NEW_WALLETS_QUERY_ID
      ? duneQueryUrl(data.REVENUE_DUNE_NEW_WALLETS_QUERY_ID)
      : undefined,
    REVENUE_DUNE_RENEWAL_FUNNEL_URL: data.REVENUE_DUNE_RENEWAL_FUNNEL_QUERY_ID
      ? duneQueryUrl(data.REVENUE_DUNE_RENEWAL_FUNNEL_QUERY_ID)
      : undefined,
    REVENUE_DUNE_REVENUE_TOTALS_URL: data.REVENUE_DUNE_REVENUE_TOTALS_QUERY_ID
      ? duneQueryUrl(data.REVENUE_DUNE_REVENUE_TOTALS_QUERY_ID)
      : undefined,
    REVENUE_DUNE_REVENUE_BY_CATEGORY_URL:
      data.REVENUE_DUNE_REVENUE_BY_CATEGORY_QUERY_ID
        ? duneQueryUrl(data.REVENUE_DUNE_REVENUE_BY_CATEGORY_QUERY_ID)
        : undefined,
    REVENUE_DUNE_RENEWAL_TENURE_URL: data.REVENUE_DUNE_RENEWAL_TENURE_QUERY_ID
      ? duneQueryUrl(data.REVENUE_DUNE_RENEWAL_TENURE_QUERY_ID)
      : undefined,
  }));

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
