import dotenv from "dotenv";
import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";

dotenv.config();

export const env = z
  .object({
    RPC_URLS: z
      .string()
      .transform((s) => s.split(","))
      .pipe(z.string().url().array().min(1)),
    DATABASE_URL: z.string().optional(),
    POLLING_INTERVAL: z.coerce.number().default(10000), // 10s
    MAX_REQUESTS_PER_SECOND: z.coerce.number().default(20),
    DAO_ID: z.nativeEnum(DaoIdEnum),
  })
  .parse(process.env);
