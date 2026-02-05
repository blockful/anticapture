import { z } from "zod";
import dotenv from "dotenv";
import { DaoIdEnum } from "@/lib/enums";

dotenv.config();

export const env = z
  .object({
    RPC_URL: z.string(),
    DATABASE_URL: z.string().optional(),
    POLLING_INTERVAL: z.coerce.number().default(10000), // 10s
    MAX_REQUESTS_PER_SECOND: z.coerce.number().default(20),
    DAO_ID: z.nativeEnum(DaoIdEnum),
    CHAIN_ID: z.coerce.number(),
  })
  .parse(process.env);
