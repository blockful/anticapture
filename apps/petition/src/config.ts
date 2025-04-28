import { z } from "zod";

export const config = z.object({
  DATABASE_URL: z.string().default("./test.db"),
  DIALECT: z.enum(["postgresql", "sqlite"]).default("sqlite"),
  PORT: z.number().default(3000),
});

export const env = config.parse(process.env);
