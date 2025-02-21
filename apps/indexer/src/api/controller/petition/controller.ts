import { db, schema } from "@/offchain/db.schema";
import { sql } from "drizzle-orm";
import { PetitionSignature } from "./types";
import { Hono } from "hono";

const app = new Hono();

app.get("/petition/:daoId", async (context) => {
  const daoId = context.req.param("daoId");
  const queryResult = await db.execute(sql`
    SELECT * FROM "petition_signatures" WHERE "dao_id" = ${daoId} 
    JOIN "accountPower" ap ON ap."account_id" = "petition_signatures"."account_id"
  `);
  return context.json(queryResult.rows);
});

app.post("/petition", async (context) => {
  const signature = context.req.json() as unknown as PetitionSignature;
  console.log(signature);


//   const petitionSignature = context.req.json() as unknown as PetitionSignature;
//   const queryResult = await db.insert(schema.petitionSignatures).values({
//     ...petitionSignature,
//     timestamp: BigInt(petitionSignature.timestamp),
//   });
  return context.json({ signature });
});

export default app;
