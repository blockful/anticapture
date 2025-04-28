import { Hono } from "hono";
import { validator } from "hono/validator";

import { PetitionService } from "./services";
import { petitionSignatureValidator } from "./middlewares";

export async function newRoutes(app: Hono, petitionService: PetitionService) {

  app.post("/petition", validator("json", petitionSignatureValidator), async (context) => {
    try {
      const petition = await petitionService.signPetition(context.req.valid("json"));
      return context.json({ petition }, 201);
    } catch (error) {
      return context.json({ error: error.message }, 400);
    }
  });

  app.get("/petition/:daoId", async (context) => {
    const daoId = context.req.param("daoId");
    const userAddress = context.req.query("userAddress");

    if (!userAddress) {
      return context.json({ error: "User address is required" }, 400);
    }

    return context.json(await petitionService.readPetitions(daoId, userAddress));
  });


}
