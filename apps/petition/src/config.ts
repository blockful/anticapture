import { config } from "dotenv";
import { z } from "zod";

config();

export const env = z.object({
  DATABASE_URL: z.string().optional().default("postgresql://postgres:postgres@localhost:5432/postgres"),
  PORT: z.coerce.number().optional().default(3100),
  API_URL: z.string().optional().default("http://localhost:3100"),
}).parse(process.env);