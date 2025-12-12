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
  historicalBalances,
  transactions,
  proposals,
  lastUpdate,
  votingPower,
  delegationPercentage,
  votingPowerVariations,
  accountBalanceVariations,
  dao,
  accountInteractions,
} from "@/api/controllers";
import { docs } from "@/api/docs";
import { env } from "@/env";
import { DaoCache } from "@/api/cache/dao-cache";
import {
  DelegationPercentageRepository,
  AccountBalanceRepository,
  DrizzleRepository,
  NFTPriceRepository,
  TokenRepository,
  TransactionsRepository,
  VotingPowerRepository,
  DrizzleProposalsActivityRepository,
  NounsVotingPowerRepository,
  AccountInteractionsRepository,
} from "@/api/repositories";
import { errorHandler } from "@/api/middlewares";
import { getClient } from "@/lib/client";
import { getChain } from "@/lib/utils";
import {
  DelegationPercentageService,
  HistoricalVotingPowerService,
  VotingPowerService,
  TransactionsService,
  ProposalsService,
  CoingeckoService,
  NFTPriceService,
  TokenService,
  BalanceVariationsService,
  HistoricalBalancesService,
  DaoService,
} from "@/api/services";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { createTreasuryProvider } from "./services/treasury/treasury-provider-factory";

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

const daoClient = getClient(env.DAO_ID, client);

if (!daoClient) {
  throw new Error(`Client not found for DAO ${env.DAO_ID}`);
}

const daoConfig = CONTRACT_ADDRESSES[env.DAO_ID];
const { blockTime, tokenType } = daoConfig;
const optimisticProposalType =
  "optimisticProposalType" in daoConfig
    ? daoConfig.optimisticProposalType
    : undefined;

const repo = new DrizzleRepository();
const votingPowerRepo = new VotingPowerRepository();
const proposalsRepo = new DrizzleProposalsActivityRepository();
const transactionsRepo = new TransactionsRepository();
const delegationPercentageRepo = new DelegationPercentageRepository();
const delegationPercentageService = new DelegationPercentageService(
  delegationPercentageRepo,
);
const accountBalanceRepo = new AccountBalanceRepository();
const accountInteractionRepo = new AccountInteractionsRepository();
const transactionsService = new TransactionsService(transactionsRepo);
const votingPowerService = new VotingPowerService(
  env.DAO_ID === DaoIdEnum.NOUNS
    ? new NounsVotingPowerRepository()
    : votingPowerRepo,
  votingPowerRepo,
);
const daoCache = new DaoCache();
const daoService = new DaoService(daoClient, daoCache, env.CHAIN_ID);
const accountBalanceService = new BalanceVariationsService(
  accountBalanceRepo,
  accountInteractionRepo,
);

createTreasuryProvider(app);

const tokenPriceClient =
  env.DAO_ID === DaoIdEnum.NOUNS
    ? new NFTPriceService(
        new NFTPriceRepository(),
        env.COINGECKO_API_URL,
        env.COINGECKO_API_KEY,
      )
    : new CoingeckoService(
        env.COINGECKO_API_URL,
        env.COINGECKO_API_KEY,
        env.DAO_ID,
      );

tokenHistoricalData(app, tokenPriceClient);
token(
  app,
  tokenPriceClient,
  new TokenService(new TokenRepository()),
  env.DAO_ID,
);

tokenDistribution(app, repo);
governanceActivity(app, repo, tokenType);
proposalsActivity(app, proposalsRepo, env.DAO_ID, daoClient);
proposals(
  app,
  new ProposalsService(repo, daoClient, optimisticProposalType),
  daoClient,
  blockTime,
);
historicalBalances(
  app,
  env.DAO_ID,
  new HistoricalVotingPowerService(votingPowerRepo),
  new HistoricalBalancesService(accountBalanceRepo),
);
transactions(app, transactionsService);
lastUpdate(app);
delegationPercentage(app, delegationPercentageService);
votingPower(app, votingPowerService);
votingPowerVariations(app, votingPowerService);
accountBalanceVariations(app, accountBalanceService);
accountInteractions(app, accountBalanceService);
dao(app, daoService);
docs(app);

export default app;
