import { z } from "zod";

export const config = z.object({
  DATABASE_URL: z.string().optional().default("./test.db"),
  DIALECT: z.enum(["postgresql", "sqlite"]).optional().default("sqlite"),
  PORT: z.number().optional().default(3000),
  ANTICAPTURE_API_URL: z.string(),
});

export const env = config.parse(process.env);
