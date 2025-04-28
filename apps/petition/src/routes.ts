import { Hono } from "hono";
import { validator } from "hono/validator";

import { PetitionService } from "./services";
import { petitionSignatureValidator } from "./middlewares";

export async function newRoutes(
  app: Hono,
  petitionService: PetitionService,
  supportedDAOs: string[]
) {

  // Create a route for each supported DAO
  supportedDAOs.forEach(daoId => {
    app.post(`/petitions/${daoId}`, validator("json", petitionSignatureValidator), async (context) => {
      try {
        const petitionData = context.req.valid("json");

        const petition = await petitionService.signPetition({
          ...petitionData,
          daoId
        });
        return context.json({ petition }, 201);
      } catch (error) {
        return context.json({ error: error.message }, 400);
      }
    });
  });

  app.get("/petitions/:daoId", async (context) => {
    const daoId = context.req.param("daoId");
    const userAddress = context.req.query("userAddress");
    return context.json(await petitionService.readPetitions(daoId, userAddress));
  });

}

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

