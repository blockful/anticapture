import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

export const pgClient = new Client({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: 5432,
  database: "postgres",
});
