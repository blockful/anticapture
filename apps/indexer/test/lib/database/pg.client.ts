import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

export const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
});
