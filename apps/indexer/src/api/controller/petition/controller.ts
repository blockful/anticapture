import { db, schema } from "@/offchain/db.schema";
import { PetitionSignature } from "./types";
import { Hono } from "hono";
import { Hex, verifyMessage } from "viem";
import { sql } from "drizzle-orm/sql";

const app = new Hono();

app.get("/petition/:daoId", async (context) => {
  const daoId = context.req.param("daoId");
  const queryResult = await db.execute(sql`
    SELECT ps.*, COALESCE(ap."voting_power", 0) as "votingPower" FROM "offchain"."petition_signatures" ps
    LEFT JOIN "public"."account" a ON a."id" = ps."account_id"
    LEFT JOIN "public"."account_power" ap ON ap."account_id" = a."id"
    WHERE ps."dao_id" = ${daoId}
  `);
  return context.json(queryResult.rows);
});

app.post("/petition", async (context) => {
  const petitionSignature =
    (await context.req.json()) as unknown as PetitionSignature;
  const verifiedSignature = await verifyMessage({
    message: petitionSignature.message,
    signature: petitionSignature.signature as Hex,
    address: petitionSignature.accountId as `0x${string}`,
  });
  if (verifiedSignature) {
    await db.insert(schema.petitionSignatures).values({
      ...petitionSignature,
      timestamp: BigInt(petitionSignature.timestamp),
    });
    return context.json({ message: "Success!" }, 200);
  }
  return context.json({ error: "Invalid signature" }, 400);
});

export default app;
