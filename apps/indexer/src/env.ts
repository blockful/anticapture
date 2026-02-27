import dotenv from "dotenv";
import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";

dotenv.config();

console.log(
  "MAX_REQUESTS_PER_SECOND raw:",
  process.env.MAX_REQUESTS_PER_SECOND,
);

export const env = z
  .object({
    RPC_URL: z.string(),
    DATABASE_URL: z.string().optional(),
    POLLING_INTERVAL: z.coerce.number().default(10000), // 10s
    MAX_REQUESTS_PER_SECOND: z.coerce.number().default(1), // TODO change back
    DAO_ID: z.nativeEnum(DaoIdEnum),
    CHAIN_ID: z.coerce.number(),
  })
  .parse(process.env);
