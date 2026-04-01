import {
  PROMETHEUS_MIME_TYPE,
  PrometheusSerializer,
  wrapWithTracing,
} from "@anticapture/observability";
import { serve } from "@hono/node-server";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { drizzle } from "drizzle-orm/node-postgres";
import { createPublicClient, http } from "viem";
import { fromZodError } from "zod-validation-error";

import { DaoCache } from "@/cache/dao-cache";
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
  delegators,
  historicalDelegations,
  votes,
  offchainProposals,
  offchainVotes,
  eventRelevance,
  feed,
  health,
} from "@/controllers";
import * as offchainSchema from "@/database/offchain-schema";
import * as schema from "@/database/schema";
import { docs } from "@/docs";
import { env } from "@/env";
import { getClient } from "@/lib/client";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getChain } from "@/lib/utils";
import { logger } from "@/logger";
import { exporter } from "@/metrics";
import { errorHandler, metricsMiddleware } from "@/middlewares";
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
  DelegatorsRepository,
  HistoricalDelegationsRepository,
  VotesRepository,
  FeedRepository,
  AccountBalanceQueryFragments,
  OffchainProposalRepository,
  OffchainVoteRepository,
} from "@/repositories";
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
  DelegatorsService,
  VotesService,
  FeedService,
  OffchainProposalsService,
  OffchainVotesService,
  EventRelevanceService,
} from "@/services";
import { AccountInteractionsService } from "@/services/account-balance/interactions";

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

app.use(async (c, next) => {
  const start = Date.now();
  let status: number | undefined;
  try {
    await next();
  } catch (err) {
    status = err instanceof HTTPException ? err.status : 500;
    throw err;
  } finally {
    logger.info(
      {
        method: c.req.method,
        url: c.req.path,
        status: status ?? c.res?.status ?? 500,
        durationMs: Date.now() - start,
      },
      "request",
    );
  }
});
app.onError(errorHandler);

app.get("/metrics", async (c) => {
  const result = await exporter.collect();
  const serialized = new PrometheusSerializer().serialize(
    result.resourceMetrics,
  );
  return c.text(serialized, 200, {
    "Content-Type": PROMETHEUS_MIME_TYPE,
  });
});

app.use(metricsMiddleware);

const chain = getChain(env.CHAIN_ID);
if (!chain) {
  throw new Error(`Chain not found for chainId ${env.CHAIN_ID}`);
}
logger.info({ chain: chain.name }, "connected to chain");

const client = createPublicClient({
  chain,
  transport: http(env.RPC_URL),
});

const daoClient = getClient(env.DAO_ID, client);

if (!daoClient) {
  throw new Error(`Client not found for DAO ${env.DAO_ID}`);
}

const pgClient = drizzle(env.DATABASE_URL, { schema, casing: "snake_case" });
const pgOffchainClient = drizzle(env.DATABASE_URL, {
  schema: offchainSchema,
  casing: "snake_case",
});

health(app, pgClient);

const daoConfig = CONTRACT_ADDRESSES[env.DAO_ID];
const { blockTime, tokenType } = daoConfig;
const optimisticProposalType =
  "optimisticProposalType" in daoConfig
    ? daoConfig.optimisticProposalType
    : undefined;

const repo = wrapWithTracing(new DrizzleRepository(pgClient));
const balanceQueryFragments = new AccountBalanceQueryFragments(pgClient);
const votingPowerRepo = wrapWithTracing(new VotingPowerRepository(pgClient));
const proposalsRepo = wrapWithTracing(
  new DrizzleProposalsActivityRepository(pgClient),
);
const transactionsRepo = wrapWithTracing(new TransactionsRepository(pgClient));
const daoMetricsDayBucketRepo = wrapWithTracing(
  new DaoMetricsDayBucketRepository(pgClient),
);
const delegationPercentageService = wrapWithTracing(
  new DelegationPercentageService(daoMetricsDayBucketRepo),
);
const tokenMetricsService = wrapWithTracing(
  new TokenMetricsService(daoMetricsDayBucketRepo),
);
const balanceVariationsRepo = wrapWithTracing(
  new BalanceVariationsRepository(pgClient, balanceQueryFragments),
);
const historicalBalancesRepo = wrapWithTracing(
  new HistoricalBalanceRepository(pgClient),
);
const accountBalanceRepo = wrapWithTracing(
  new AccountBalanceRepository(pgClient, balanceQueryFragments),
);
const accountInteractionRepo = wrapWithTracing(
  new AccountInteractionsRepository(pgClient),
);
const transactionsService = wrapWithTracing(
  new TransactionsService(transactionsRepo),
);
const votingPowerService = wrapWithTracing(
  new VotingPowerService(
    env.DAO_ID === DaoIdEnum.NOUNS || env.DAO_ID === DaoIdEnum.LIL_NOUNS
      ? wrapWithTracing(new NounsVotingPowerRepository(pgClient))
      : votingPowerRepo,
    votingPowerRepo,
  ),
);
const daoCache = new DaoCache();
const daoService = wrapWithTracing(
  new DaoService(daoClient, daoCache, env.CHAIN_ID),
);
const balanceVariationsService = wrapWithTracing(
  new BalanceVariationsService(balanceVariationsRepo, accountBalanceRepo),
);
const accountBalanceService = wrapWithTracing(
  new AccountBalanceService(accountBalanceRepo),
);

const tokenPriceClient = wrapWithTracing(
  env.DAO_ID === DaoIdEnum.NOUNS || env.DAO_ID === DaoIdEnum.LIL_NOUNS
    ? new NFTPriceService(
        wrapWithTracing(new NFTPriceRepository(pgClient)),
        env.COINGECKO_API_URL,
        env.COINGECKO_API_KEY,
      )
    : new CoingeckoService(
        env.COINGECKO_API_URL,
        env.COINGECKO_API_KEY,
        env.DAO_ID,
      ),
);

historicalDelegations(
  app,
  wrapWithTracing(
    new HistoricalDelegationsService(
      wrapWithTracing(new HistoricalDelegationsRepository(pgClient)),
    ),
  ),
);

// TODO: add support to partial delegations at some point
delegations(
  app,
  wrapWithTracing(
    new DelegationsService(
      wrapWithTracing(new DelegationsRepository(pgClient)),
    ),
  ),
);
delegators(
  app,
  wrapWithTracing(
    new DelegatorsService(wrapWithTracing(new DelegatorsRepository(pgClient))),
  ),
);

const treasuryService = wrapWithTracing(
  createTreasuryService(
    wrapWithTracing(new TreasuryRepository(pgClient)),
    tokenPriceClient,
    parseTreasuryProviderConfig(
      env.TREASURY_DATA_PROVIDER_ID,
      env.TREASURY_DATA_PROVIDER_API_URL,
      env.TREASURY_DATA_PROVIDER_API_KEY,
    ),
  ),
);
const decimals = CONTRACT_ADDRESSES[env.DAO_ID].token.decimals;

treasury(app, treasuryService, decimals);
tokenHistoricalData(app, tokenPriceClient);
token(
  app,
  tokenPriceClient,
  wrapWithTracing(
    new TokenService(wrapWithTracing(new TokenRepository(pgClient))),
  ),
  env.DAO_ID,
);

feed(
  app,
  wrapWithTracing(
    new FeedService(env.DAO_ID, wrapWithTracing(new FeedRepository(pgClient))),
  ),
);
eventRelevance(app, new EventRelevanceService(env.DAO_ID));
tokenDistribution(app, repo);
governanceActivity(app, repo, tokenType);
proposalsActivity(app, proposalsRepo, env.DAO_ID, daoClient);
proposals(
  app,
  wrapWithTracing(
    new ProposalsService(repo, daoClient, optimisticProposalType),
  ),
  daoClient,
  blockTime,
);
historicalBalances(
  app,
  wrapWithTracing(new HistoricalBalancesService(historicalBalancesRepo)),
);
transactions(app, transactionsService);
lastUpdate(app, pgClient);
delegationPercentage(app, delegationPercentageService);
historicalVotingPower(app, votingPowerService);
votingPowerVariations(app, votingPowerService);
votingPowers(app, votingPowerService);
accountBalanceVariations(app, balanceVariationsService);
accountBalances(app, env.DAO_ID, accountBalanceService);
accountInteractions(
  app,
  wrapWithTracing(new AccountInteractionsService(accountInteractionRepo)),
);
transfers(
  app,
  wrapWithTracing(
    new TransfersService(wrapWithTracing(new TransfersRepository(pgClient))),
  ),
);
votes(
  app,
  wrapWithTracing(
    new VotesService(wrapWithTracing(new VotesRepository(pgClient))),
  ),
);
dao(app, daoService);
docs(app);
tokenMetrics(app, tokenMetricsService);

const offchainProposalsRepo = wrapWithTracing(
  new OffchainProposalRepository(pgOffchainClient),
);
const offchainVotesRepo = wrapWithTracing(
  new OffchainVoteRepository(pgOffchainClient),
);
offchainProposals(
  app,
  wrapWithTracing(new OffchainProposalsService(offchainProposalsRepo)),
);
offchainVotes(
  app,
  wrapWithTracing(new OffchainVotesService(offchainVotesRepo)),
);

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    logger.info({ port: info.port }, "server running");
  },
);
