import dotenv from "dotenv";
import { AnvilInstance } from "./anvil";
import { clearAllDataFromDatabase } from "./database/clearAllData";
import { pgClient } from "./database/pg.client";
dotenv.config();

afterAll(async () => {
  await clearAllDataFromDatabase();
  await pgClient.end();
});
