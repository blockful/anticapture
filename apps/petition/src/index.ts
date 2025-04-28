import { Hono } from "hono";
import { serve } from "@hono/node-server";

import { env } from "./config";
import { newRoutes } from "./routes";
import { PetitionService } from "./services/signPetition";
import { PostgresPetitionRepository } from "./repositories";

const db = new PostgresPetitionRepository(env.DATABASE_URL);

const app = new Hono();

const petitionService = new PetitionService(db);

newRoutes(app, petitionService);

serve({
  fetch: app.fetch,
  port: env.PORT
}, (info) => console.log(`Server is running on port ${info.port}`))
