import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { drizzle } from "drizzle-orm/node-postgres";
import { serve } from "@hono/node-server";

import { logger } from "hono/logger";
import * as schema from "@/database/schema";
import { fromZodError } from "zod-validation-error";
import { createPublicClient, http } from "viem";

import {
  accountBalanceVariations,
  accountBalances,
  accountInteractions,
  dao,
  delegationPercentage,
  governanceActivity,
  historicalBalances,
  historicalVotingPower,
  lastUpdate,
  proposals,
  proposalsActivity,
  token,
  tokenDistribution,
  tokenHistoricalData,
  transactions,
  transfers,
  tokenMetrics,
  treasury,
  votingPowerVariations,
  votingPowers,
  delegations,
  historicalDelegations,
  votes,
} from "@/controllers";
import { docs } from "@/docs";
import { env } from "@/env";
import { DaoCache } from "@/cache/dao-cache";
import {
  AccountBalanceRepository,
  AccountInteractionsRepository,
  BalanceVariationsRepository,
  DaoMetricsDayBucketRepository,
  DrizzleProposalsActivityRepository,
  DrizzleRepository,
  HistoricalBalanceRepository,
  NFTPriceRepository,
  NounsVotingPowerRepository,
  TokenRepository,
  TransactionsRepository,
  TransfersRepository,
  TreasuryRepository,
  VotingPowerRepository,
  DelegationsRepository,
  HistoricalDelegationsRepository,
  VotesRepository,
  FeedRepository,
} from "@/repositories";
import { errorHandler } from "@/middlewares";
import { getClient } from "@/lib/client";
import { getChain } from "@/lib/utils";
import {
  AccountBalanceService,
  BalanceVariationsService,
  CoingeckoService,
  DaoService,
  DelegationPercentageService,
  HistoricalBalancesService,
  NFTPriceService,
  ProposalsService,
  TokenService,
  TransactionsService,
  TransfersService,
  TokenMetricsService,
  VotingPowerService,
  createTreasuryService,
  parseTreasuryProviderConfig,
  HistoricalDelegationsService,
  DelegationsService,
  VotesService,
  FeedService,
} from "@/services";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { feed } from "./controllers/feed";

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

const pgClient = drizzle(env.DATABASE_URL, { schema, casing: "snake_case" });

const daoConfig = CONTRACT_ADDRESSES[env.DAO_ID];
const { blockTime, tokenType } = daoConfig;
const optimisticProposalType =
  "optimisticProposalType" in daoConfig
    ? daoConfig.optimisticProposalType
    : undefined;

const repo = new DrizzleRepository(pgClient);
const votingPowerRepo = new VotingPowerRepository(pgClient);
const proposalsRepo = new DrizzleProposalsActivityRepository(pgClient);
const transactionsRepo = new TransactionsRepository(pgClient);
const daoMetricsDayBucketRepo = new DaoMetricsDayBucketRepository(pgClient);
const delegationPercentageService = new DelegationPercentageService(
  daoMetricsDayBucketRepo,
);
const tokenMetricsService = new TokenMetricsService(daoMetricsDayBucketRepo);
const balanceVariationsRepo = new BalanceVariationsRepository(pgClient);
const historicalBalancesRepo = new HistoricalBalanceRepository(pgClient);
const accountBalanceRepo = new AccountBalanceRepository(pgClient);
const accountInteractionRepo = new AccountInteractionsRepository(pgClient);
const transactionsService = new TransactionsService(transactionsRepo);
const votingPowerService = new VotingPowerService(
  env.DAO_ID === DaoIdEnum.NOUNS
    ? new NounsVotingPowerRepository(pgClient)
    : votingPowerRepo,
  votingPowerRepo,
);
const daoCache = new DaoCache();
const daoService = new DaoService(daoClient, daoCache, env.CHAIN_ID);
const balanceVariationsService = new BalanceVariationsService(
  balanceVariationsRepo,
  accountInteractionRepo,
);
const accountBalanceService = new AccountBalanceService(accountBalanceRepo);

const tokenPriceClient =
  env.DAO_ID === DaoIdEnum.NOUNS
    ? new NFTPriceService(
        new NFTPriceRepository(pgClient),
        env.COINGECKO_API_URL,
        env.COINGECKO_API_KEY,
      )
    : new CoingeckoService(
        env.COINGECKO_API_URL,
        env.COINGECKO_API_KEY,
        env.DAO_ID,
      );

historicalDelegations(
  app,
  new HistoricalDelegationsService(
    new HistoricalDelegationsRepository(pgClient),
  ),
);

// TODO: add support to partial delegations at some point
delegations(app, new DelegationsService(new DelegationsRepository(pgClient)));

const treasuryService = createTreasuryService(
  new TreasuryRepository(pgClient),
  tokenPriceClient,
  parseTreasuryProviderConfig(
    env.TREASURY_DATA_PROVIDER_ID,
    env.TREASURY_DATA_PROVIDER_API_URL,
    env.TREASURY_DATA_PROVIDER_API_KEY,
  ),
);
const decimals = CONTRACT_ADDRESSES[env.DAO_ID].token.decimals;

treasury(app, treasuryService, decimals);
tokenHistoricalData(app, tokenPriceClient);
token(
  app,
  tokenPriceClient,
  new TokenService(new TokenRepository(pgClient)),
  env.DAO_ID,
);

feed(app, new FeedService(new FeedRepository(pgClient)));
tokenDistribution(app, repo);
governanceActivity(app, repo, tokenType);
proposalsActivity(app, proposalsRepo, env.DAO_ID, daoClient);
proposals(
  app,
  new ProposalsService(repo, daoClient, optimisticProposalType),
  daoClient,
  blockTime,
);
historicalBalances(app, new HistoricalBalancesService(historicalBalancesRepo));
transactions(app, transactionsService);
lastUpdate(app, pgClient);
delegationPercentage(app, delegationPercentageService);
historicalVotingPower(app, votingPowerService);
votingPowerVariations(app, votingPowerService);
votingPowers(app, votingPowerService);
accountBalanceVariations(app, balanceVariationsService);
accountBalances(app, env.DAO_ID, accountBalanceService);
accountInteractions(app, balanceVariationsService);
transfers(app, new TransfersService(new TransfersRepository(pgClient)));
votes(app, new VotesService(new VotesRepository(pgClient)));
dao(app, daoService);
docs(app);
tokenMetrics(app, tokenMetricsService);

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  },
);
