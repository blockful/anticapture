import app from "@/api";
import { db } from "@/offchain/db.schema";
import { sql } from "drizzle-orm";

app.get("/petition/:daoId", async (context) => {
  const daoId = context.req.param("daoId");
  const queryResult = await db.execute(sql`
    SELECT * FROM "petition_signatures" WHERE "dao_id" = ${daoId} 
    JOIN "accountPower" ap ON ap."account_id" = "petition_signatures"."account_id"
  `);
  return context.json(queryResult.rows);
});

app.post("/")