import { db, schema } from "@/offchain/db.schema";
import { isPetitionSignature, PetitionSignature } from "./types";
import { Hono } from "hono";
import { Hex, verifyMessage } from "viem";
import { eq } from "drizzle-orm";

const app = new Hono();

app.get("/petition/:daoId", async (context) => {
  // Getting the daoId from the url
  const daoId = context.req.param("daoId");
  // Getting the petition signatures from the db
  const petitionSignatures = await db
    .select()
    .from(schema.petitionSignatures)
    .leftJoin(
      schema.account,
      eq(schema.petitionSignatures.accountId, schema.account.id),
    )
    .leftJoin(
      schema.accountPower,
      eq(schema.account.id, schema.accountPower.accountId),
    )
    .where(eq(schema.petitionSignatures.daoId, daoId));
  // Returning the petition signatures
  return context.json(petitionSignatures);
});

app.post("/petition", async (context) => {
  // Getting the body and verifying if it's in the correct format
  const body = (await context.req.json()) as any;

  if (!isPetitionSignature(body)) {
    return context.json({ error: "Invalid petition signature" }, 400);
  }

  // Verifying if the signature comes from the address, and the signed message is the same.
  const petitionSignature = body as PetitionSignature;
  const verifiedSignature = await verifyMessage({
    message: petitionSignature.message,
    signature: petitionSignature.signature as Hex,
    address: petitionSignature.accountId as `0x${string}`,
  });

  if (verifiedSignature) {
    // Inserts the message into the db
    await db.insert(schema.petitionSignatures).values({
      ...petitionSignature,
      timestamp: petitionSignature.timestamp,
    });
    return context.json({ message: "Success!" }, 200);
  }
  // Returns error in case the signature is not valid
  return context.json({ error: "Invalid signature" }, 400);
});

export default app;
