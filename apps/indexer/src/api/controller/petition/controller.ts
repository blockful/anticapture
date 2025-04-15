import { db, schema } from "@/offchain/db.schema";
import { isPetitionSignature, PetitionSignature } from "./types";
import { Hono } from "hono";
import { Hex, verifyMessage } from "viem";
import { desc, eq } from "drizzle-orm";

const app = new Hono();

app.get("/petition/:daoId", async (context) => {
  // Getting the daoId from the url
  const daoId = context.req.param("daoId");
  const userAddress = context.req.query("userAddress");
  // Getting the petition signatures from the db
  const petitionSignatures = await db
    .select({
      accountId: schema.petitionSignatures.accountId,
      daoId: schema.petitionSignatures.daoId,
      timestamp: schema.petitionSignatures.timestamp,
      message: schema.petitionSignatures.message,
      signature: schema.petitionSignatures.signature,
      votingPower: schema.accountPower.votingPower,
    })
    .from(schema.petitionSignatures)
    .leftJoin(
      schema.account,
      eq(schema.petitionSignatures.accountId, schema.account.id)
    )
    .leftJoin(
      schema.accountPower,
      eq(schema.account.id, schema.accountPower.accountId)
    )
    .where(eq(schema.petitionSignatures.daoId, daoId))
    .orderBy(desc(schema.petitionSignatures.timestamp));
  const petitionSignaturesResponse = {
    petitionSignatures,
    totalSignatures: petitionSignatures.length,
    totalSignaturesPower: petitionSignatures.reduce(
      (acc, curr) => (curr.votingPower ? acc + curr.votingPower : acc),
      0n
    ),
    latestVoters: petitionSignatures
      .slice(0, 10)
      .map(({ accountId }) => accountId),

    userSigned: petitionSignatures.some(
      (signature) =>
        signature.accountId.toLowerCase() === userAddress?.toLowerCase()
    ),
  };
  // Returning the petition signatures
  return context.json(petitionSignaturesResponse);
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
