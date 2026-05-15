import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/general-schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["general"],
});
