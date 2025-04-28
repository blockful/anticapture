import { Hono } from "hono";
import { validator } from "hono/validator";

import { petitionSignatureValidator } from "./middlewares";
import { PetitionService } from "./services/signPetition";

export function newRoutes(app: Hono, petitionService: PetitionService) {
  app.post("/petition", validator("json", petitionSignatureValidator), async (context) => {
    try {
      await petitionService.signPetition(context.req.valid("json"));
      return context.json({ message: "Success!" }, 200);
    } catch (error) {
      return context.json({ error: error.message }, 400);
    }
  });
}

// app.get("/petition/:daoId", async (context) => {
//   const daoId = context.req.param("daoId");
//   const userAddress = context.req.query("userAddress");

//   const petitionSignatures = await db
//     .select({
//       accountId: schema.petitionSignatures.accountId,
//       daoId: schema.petitionSignatures.daoId,
//       timestamp: schema.petitionSignatures.timestamp,
//       message: schema.petitionSignatures.message,
//       signature: schema.petitionSignatures.signature,
//       votingPower: schema.accountPower.votingPower,
//     })
//     .from(schema.petitionSignatures)
//     // .leftJoin(
//     //   schema.account,
//     //   eq(schema.petitionSignatures.accountId, schema.account.id)
//     // )
//     // .leftJoin(
//     //   schema.accountPower,
//     //   and(
//     //     eq(schema.account.id, schema.accountPower.accountId),
//     //     eq(schema.accountPower.daoId, daoId)
//     //   )
//     // )
//     .where(eq(schema.petitionSignatures.daoId, daoId))
//     .orderBy(desc(schema.petitionSignatures.timestamp));
//   const petitionSignaturesResponse = {
//     petitionSignatures,
//     totalSignatures: petitionSignatures.length,
//     totalSignaturesPower: petitionSignatures.reduce(
//       (acc: bigint, curr: { votingPower: bigint }) => (curr.votingPower ? acc + curr.votingPower : acc),
//       0n
//     ),
//     latestVoters: petitionSignatures
//       .slice(0, 10)
//       .map(({ accountId }) => accountId),

//     userSigned: petitionSignatures.some(
//       (signature) =>
//         signature.accountId.toLowerCase() === userAddress?.toLowerCase()
//     ),
//   };
//   // Returning the petition signatures
//   return context.json(petitionSignaturesResponse);
// });

