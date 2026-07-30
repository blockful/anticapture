import dotenv from "dotenv";

import { envSchema } from "@/env-schema";

dotenv.config();
const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
