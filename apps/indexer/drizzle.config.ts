import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/offchain/migrations",
  schema: "./src/offchain/offchain.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
