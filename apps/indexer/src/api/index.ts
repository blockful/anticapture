import { db } from "ponder:api";
import { graphql } from "ponder";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import schema from "ponder:schema";
import { logger } from "hono/logger";
import { fromZodError } from "zod-validation-error";

import {
  governanceActivity,
  tokenDistribution,
  tokenHistoricalData,
  assets,
  proposalsActivity,
  historicalOnchain,
} from "./controller";
import { DrizzleProposalsActivityRepository } from "./repositories/proposals-activity.repository";
import { docs } from "./docs";
import { DuneService } from "@/api/services/dune/dune.service";
import { env } from "@/env";
import { CoingeckoService } from "./services/coingecko/coingecko.service";
import { DrizzleRepository } from "./repositories";
import { errorHandler } from "./middlewares";

const app = new Hono({
  defaultHook: (result, c) => {
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return c.json(
        {
          error: "Validation Error",
          message: validationError.message,
          details: validationError.details,
        },
        400,
      );
    }
  },
});

app.use(logger());
app.onError(errorHandler);

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

if (env.DUNE_API_URL && env.DUNE_API_KEY) {
  const duneClient = new DuneService(env.DUNE_API_URL, env.DUNE_API_KEY);
  assets(app, duneClient);
}

if (env.COINGECKO_API_KEY) {
  const coingeckoClient = new CoingeckoService(env.COINGECKO_API_KEY);
  tokenHistoricalData(app, coingeckoClient);
}

const repo = new DrizzleRepository();
const proposalsRepo = new DrizzleProposalsActivityRepository();

tokenDistribution(app, repo);
governanceActivity(app, repo);
proposalsActivity(app, proposalsRepo);
historicalOnchain(app);
docs(app);

export default app;
