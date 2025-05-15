import { db } from "ponder:api";
import { graphql } from "ponder";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import schema from "ponder:schema";

import {
  governanceActivity,
  tokenDistribution,
  votingPower,
  tokenHistoricalData,
  assets,
} from "./controller";
import { docs } from "./docs";
import { DuneService } from "@/api/services/dune/dune.service";
import { env } from "@/env";
import { CoingeckoService } from "./services/coingecko/coingecko.service";

const app = new Hono();

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

tokenDistribution(app);
governanceActivity(app);
docs(app, env.API_URL!);

export default app;
