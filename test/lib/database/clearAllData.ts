import dotenv from "dotenv";
import { pgClient } from "./pg.client.ts";
dotenv.config();
// BEFORE RUNNING THIS QUERY YOU NEED TO RUN THE FOLLOWING:
// 1: GRANT ALL PRIVILEGES ON DATABASE postgres TO admin;
//
// 2: GRANT ALL PRIVILEGES ON SCHEMA public TO admin;
//
// 3: ALTER SCHEMA public OWNER TO admin;


export const clearAllDataFromDatabase = async () => {
  if (process.env.STATUS !== "test") {
    throw new Error("ERROR: You are not in a test environment");
  }
  await pgClient.query('DROP SCHEMA IF EXISTS ponder CASCADE');
  await pgClient.query('DROP SCHEMA IF EXISTS ponder_sync CASCADE');
  await pgClient.query('DROP SCHEMA IF EXISTS public CASCADE');
};
