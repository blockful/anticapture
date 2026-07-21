import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();

// The User API runs on its own Postgres database (default `public` schema), so —
// unlike the DAO API's namespaced `general`/`anticapture` schemas — no
// schemaFilter is needed and the better-auth CLI's unqualified table output
// works directly.
export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
