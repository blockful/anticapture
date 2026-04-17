import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: `${process.env.DATABASE_URL}?options=-c%20search_path%3Danticapture`,
  },
  out: "./drizzle",
  tablesFilter: ["!_ponder_*", "!_reorg__*"],
});
