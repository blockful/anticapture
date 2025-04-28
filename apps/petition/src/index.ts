import { Hono } from "hono";
import { serve } from "@hono/node-server";

import { env } from "./config";
import { newRoutes } from "./routes";
import { PetitionService } from "./services";
import { GraphqlAnticaptureClient } from "./client";
import { PostgresPetitionRepository } from "./repositories";

(async () => {

  const app = new Hono();

  const db = new PostgresPetitionRepository(env.DATABASE_URL);
  const anticaptureClient = new GraphqlAnticaptureClient(env.ANTICAPTURE_API_URL);
  const petitionService = new PetitionService(db, anticaptureClient);

  const supportedDAOs = await anticaptureClient.getDAOs();
  newRoutes(app, petitionService, supportedDAOs);

  serve({
    fetch: app.fetch,
    port: env.PORT
  }, (info) => console.log(`Server is running on port ${info.port}`))

})()
