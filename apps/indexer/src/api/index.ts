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
  token,
  proposalsActivity,
  historicalOnchain,
  transactions,
  proposals,
  lastUpdate,
  assets,
  votingPower,
} from "./controller";
import { DrizzleProposalsActivityRepository } from "./repositories/proposals-activity.repository";
import { docs } from "./docs";
import { env } from "@/env";
import { CoingeckoService } from "./services/coingecko/coingecko.service";
import {
  AccountBalanceRepository,
  DrizzleRepository,
  TokenRepository,
  TransactionsRepository,
  VotingPowerRepository,
} from "./repositories";
import { TransactionsService } from "./services/transactions";
import { errorHandler } from "./middlewares";
import { ProposalsService } from "./services/proposals";
import { getClient } from "@/lib/client";
import { getChain } from "@/lib/utils";
import { HistoricalVotingPowerService, VotingPowerService } from "./services";
import { DuneService } from "./services/dune/dune.service";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { votingPowerVariations } from "./controller/top-voting-power-variations";
import { TokenService } from "./services/token";
import { topAccountBalanceVariations } from "./controller";
import { TopBalanceVariationsService } from "./services";

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
  token(
    app,
    coingeckoClient,
    new TokenService(new TokenRepository()),
    env.DAO_ID,
  );
}

const daoClient = getClient(env.DAO_ID, client);

if (!daoClient) {
  throw new Error(`Client not found for DAO ${env.DAO_ID}`);
}

const { blockTime } = CONTRACT_ADDRESSES[env.DAO_ID];

const repo = new DrizzleRepository();
const votingPowerRepo = new VotingPowerRepository();
const proposalsRepo = new DrizzleProposalsActivityRepository();
const transactionsRepo = new TransactionsRepository();
const accountBalanceRepo = new AccountBalanceRepository();
const transactionsService = new TransactionsService(transactionsRepo);
const votingPowerService = new VotingPowerService(votingPowerRepo);

tokenDistribution(app, repo);
governanceActivity(app, repo);
proposalsActivity(app, proposalsRepo, env.DAO_ID, daoClient);
proposals(app, new ProposalsService(repo, daoClient), daoClient, blockTime);
historicalOnchain(
  app,
  env.DAO_ID,
  new HistoricalVotingPowerService(votingPowerRepo),
);
transactions(app, transactionsService);
lastUpdate(app);
votingPower(app, votingPowerService);
votingPowerVariations(app, votingPowerService);
topAccountBalanceVariations(
  app,
  new TopBalanceVariationsService(accountBalanceRepo),
);
docs(app);

export default app;
