import { db } from "ponder:api";
import { graphql } from "ponder";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import schema from "ponder:schema";
import { logger } from "hono/logger";
import { fromZodError } from "zod-validation-error";
import { createPublicClient, http } from "viem";

import {
  governanceActivity,
  tokenHistoricalData,
  tokenDistribution,
  proposalsActivity,
  historicalOnchain,
  proposals,
  daoController,
  assets,
} from "./controller";
import { DrizzleProposalsActivityRepository } from "./repositories/proposals-activity.repository";
import { docs } from "./docs";
import { env } from "@/env";
import { CoingeckoService } from "./services/coingecko/coingecko.service";
import { DrizzleRepository } from "./repositories";
import { errorHandler } from "./middlewares";
import { ProposalsService } from "./services/proposals";
import { getGovernor } from "@/lib/governor";
import { getChain } from "@/lib/utils";
import { HistoricalVotingPowerService } from "./services";
import { DuneService } from "./services/dune/dune.service";

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

const chain = getChain(env.CHAIN_ID);
if (!chain) {
  throw new Error(`Chain not found for chainId ${env.CHAIN_ID}`);
}
console.log("Connected to chain", chain.name);

const client = createPublicClient({
  chain,
  transport: http(env.RPC_URL),
});

if (env.DUNE_API_URL && env.DUNE_API_KEY) {
  const duneClient = new DuneService(env.DUNE_API_URL, env.DUNE_API_KEY);
  assets(app, duneClient);
}

if (env.COINGECKO_API_KEY) {
  const coingeckoClient = new CoingeckoService(env.COINGECKO_API_KEY);
  tokenHistoricalData(app, coingeckoClient, env.DAO_ID);
}

const governorClient = getGovernor(env.DAO_ID, client);

if (!governorClient) {
  throw new Error(`Governor client not found for DAO ${env.DAO_ID}`);
}

const repo = new DrizzleRepository();
const proposalsRepo = new DrizzleProposalsActivityRepository();

tokenDistribution(app, repo);
governanceActivity(app, repo);
proposalsActivity(app, proposalsRepo, env.DAO_ID);
proposals(app, new ProposalsService(repo, governorClient));
daoController(app, governorClient, env.DAO_ID);
historicalOnchain(app, env.DAO_ID, new HistoricalVotingPowerService(repo));
docs(app);

export default app;
