import {
  PROMETHEUS_MIME_TYPE,
  PrometheusSerializer,
  wrapWithTracing,
} from "@anticapture/observability";
import { serve } from "@hono/node-server";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { seed } from "drizzle-seed";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logger } from "@/logger";
import { createPublicClient, http } from "viem";
import { fromZodError } from "zod-validation-error";

import { DaoCache } from "@/cache/dao-cache";
import {
  accountBalances,
  dao,
  historicalBalances,
  historicalVotingPower,
  transfers,
  votingPowers,
  delegations,
  delegators,
  historicalDelegations,
  token,
  accountInteractions,
  health,
} from "@/controllers";
import * as schema from "@/database/schema";
import { docs } from "@/docs";
import { env } from "@/env";
import { getClient } from "@/lib/client";
import { getChain } from "@/lib/utils";
import { exporter } from "@/metrics";
import { errorHandler, metricsMiddleware } from "@/middlewares";
import {
  HistoricalBalanceRepository,
  TransfersRepository,
  DelegationsRepository,
  DelegatorsRepository,
  HistoricalDelegationsRepository,
  AccountBalanceQueryFragments,
  AAVEAccountBalanceRepository,
  TokenRepository,
} from "@/repositories";
import { AAVEVotingPowerRepository } from "@/repositories/voting-power/aave";
import {
  AccountBalanceService,
  DaoService,
  HistoricalBalancesService,
  TransfersService,
  HistoricalDelegationsService,
  DelegationsService,
  DelegatorsService,
  CoingeckoService,
  TokenService,
} from "@/services";
import { AAVEVotingPowerService } from "@/services/voting-power/aave";
import { AccountInteractionsService } from "@/services/account-balance/interactions";
import { HTTPException } from "hono/http-exception";

const CI = !["dev", "production"].includes(
  process.env.RAILWAY_ENVIRONMENT_NAME || "rw",
);

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

health(app, pgClient);

const daoCache = new DaoCache();

const daoService = wrapWithTracing(
  new DaoService(daoClient, daoCache, env.CHAIN_ID),
);
const votingPowerService = wrapWithTracing(
  new AAVEVotingPowerService(
    wrapWithTracing(new AAVEVotingPowerRepository(pgClient)),
  ),
);
const accountBalanceRepo = wrapWithTracing(
  new AAVEAccountBalanceRepository(
    pgClient,
    new AccountBalanceQueryFragments(pgClient),
  ),
);
const accountBalanceService = wrapWithTracing(
  new AccountBalanceService(accountBalanceRepo),
);
historicalDelegations(
  app,
  wrapWithTracing(
    new HistoricalDelegationsService(
      wrapWithTracing(new HistoricalDelegationsRepository(pgClient)),
    ),
  ),
);

token(
  app,
  wrapWithTracing(
    new CoingeckoService(
      env.COINGECKO_API_URL,
      env.COINGECKO_API_KEY,
      env.DAO_ID,
    ),
  ),
  wrapWithTracing(
    new TokenService(wrapWithTracing(new TokenRepository(pgClient))),
  ),
  env.DAO_ID,
);
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
historicalBalances(
  app,
  wrapWithTracing(
    new HistoricalBalancesService(
      wrapWithTracing(new HistoricalBalanceRepository(pgClient)),
    ),
  ),
);
historicalVotingPower(app, votingPowerService);
votingPowers(app, votingPowerService);
accountBalances(app, env.DAO_ID, accountBalanceService);
accountInteractions(
  app,
  wrapWithTracing(new AccountInteractionsService(accountBalanceRepo)),
);
transfers(
  app,
  wrapWithTracing(
    new TransfersService(wrapWithTracing(new TransfersRepository(pgClient))),
  ),
);
dao(app, daoService);
docs(app);

if (CI) {
  logger.info(
    "Deploying CI configuration; migrating database schema with test data seed",
  );
  await migrate(pgClient, { migrationsFolder: "./drizzle" });
  const ciClient = drizzle(env.DATABASE_URL, { schema, casing: "snake_case" });
  await ciClient.execute(
    sql.raw(
      `TRUNCATE anticapture.token, anticapture.account, anticapture.account_balance, anticapture.account_power, anticapture.voting_power_history, anticapture.balance_history, anticapture.delegations, anticapture.transfers, anticapture.votes_onchain, anticapture.proposals_onchain, anticapture.dao_metrics_day_buckets, anticapture.transaction, anticapture.token_price, anticapture.feed_event CASCADE`,
    ),
  );
  const ADDRESSES = Array.from(
    { length: 1000 },
    (_, i) => `0x${String(i).padStart(40, "0")}` as const,
  );
  const TX_HASHES = Array.from(
    { length: 1000 },
    (_, i) => `0x${String(i).padStart(64, "0")}` as const,
  );
  const TOKEN_IDS = ADDRESSES.slice(0, 5);
  const DAO_ID = env.DAO_ID;
  const PROPOSAL_STATUSES = [
    "ACTIVE",
    "CANCELED",
    "DEFEATED",
    "SUCCEEDED",
    "QUEUED",
    "EXECUTED",
    "EXPIRED",
  ];
  const VOTE_SUPPORTS = ["FOR", "AGAINST", "ABSTAIN"];
  const FEED_EVENT_TYPES = [
    "VOTE",
    "PROPOSAL",
    "DELEGATION",
    "TRANSFER",
    "DELEGATION_VOTES_CHANGED",
    "PROPOSAL_EXTENDED",
  ];

  const accountBalanceRows = ADDRESSES.slice(0, 200).flatMap((accountId, i) =>
    TOKEN_IDS.map((tokenId) => ({
      accountId: accountId as `0x${string}`,
      tokenId,
      balance: BigInt(i + 1),
      delegate: ADDRESSES[i % ADDRESSES.length] as `0x${string}`,
    })),
  );
  for (let i = 0; i < accountBalanceRows.length; i += 500) {
    await ciClient
      .insert(schema.accountBalance)
      .values(accountBalanceRows.slice(i, i + 500));
  }

  const PROPOSAL_IDS = Array.from({ length: 1000 }, (_, i) => `proposal-${i}`);
  const votesOnchainRows = ADDRESSES.map((voterAccountId, i) => ({
    txHash: TX_HASHES[i] as `0x${string}`,
    daoId: DAO_ID,
    voterAccountId: voterAccountId as `0x${string}`,
    proposalId: PROPOSAL_IDS[i]!,
    support: VOTE_SUPPORTS[i % VOTE_SUPPORTS.length]!,
    votingPower: BigInt(i + 1),
    reason: null,
    timestamp: BigInt(i + 1),
  }));
  for (let i = 0; i < votesOnchainRows.length; i += 500) {
    await ciClient
      .insert(schema.votesOnchain)
      .values(votesOnchainRows.slice(i, i + 500));
  }

  await seed(ciClient, schema, { count: 1000 }).refine((f) => ({
    token: {
      count: TOKEN_IDS.length,
      columns: {
        id: f.valuesFromArray({ values: TOKEN_IDS, isUnique: true }),
      },
    },
    account: {
      columns: {
        id: f.valuesFromArray({ values: ADDRESSES, isUnique: true }),
      },
    },
    accountBalance: { count: 0 },
    accountPower: {
      columns: {
        accountId: f.valuesFromArray({ values: ADDRESSES, isUnique: true }),
        daoId: f.default({ defaultValue: DAO_ID }),
      },
    },
    votingPowerHistory: {
      columns: {
        transactionHash: f.valuesFromArray({ values: TX_HASHES }),
        daoId: f.default({ defaultValue: DAO_ID }),
        accountId: f.valuesFromArray({ values: ADDRESSES }),
      },
    },
    balanceHistory: {
      columns: {
        transactionHash: f.valuesFromArray({ values: TX_HASHES }),
        daoId: f.default({ defaultValue: DAO_ID }),
        accountId: f.valuesFromArray({ values: ADDRESSES }),
      },
    },
    delegation: {
      columns: {
        transactionHash: f.valuesFromArray({ values: TX_HASHES }),
        daoId: f.default({ defaultValue: DAO_ID }),
        delegateAccountId: f.valuesFromArray({ values: ADDRESSES }),
        delegatorAccountId: f.valuesFromArray({ values: ADDRESSES }),
        previousDelegate: f.valuesFromArray({ values: ADDRESSES }),
      },
    },
    transfer: {
      columns: {
        transactionHash: f.valuesFromArray({ values: TX_HASHES }),
        daoId: f.default({ defaultValue: DAO_ID }),
        tokenId: f.valuesFromArray({ values: TOKEN_IDS }),
        fromAccountId: f.valuesFromArray({ values: ADDRESSES }),
        toAccountId: f.valuesFromArray({ values: ADDRESSES }),
      },
    },
    votesOnchain: { count: 0 },
    proposalsOnchain: {
      columns: {
        txHash: f.valuesFromArray({ values: TX_HASHES }),
        daoId: f.default({ defaultValue: DAO_ID }),
        proposerAccountId: f.valuesFromArray({ values: ADDRESSES }),
        status: f.valuesFromArray({ values: PROPOSAL_STATUSES }),
        targets: f.default({ defaultValue: [] }),
        values: f.default({ defaultValue: [] }),
        signatures: f.default({ defaultValue: [] }),
        calldatas: f.default({ defaultValue: [] }),
      },
    },
    daoMetricsDayBucket: {
      columns: {
        daoId: f.default({ defaultValue: DAO_ID }),
        tokenId: f.valuesFromArray({ values: TOKEN_IDS }),
      },
    },
    transaction: {
      columns: {
        transactionHash: f.valuesFromArray({
          values: TX_HASHES,
          isUnique: true,
        }),
        fromAddress: f.valuesFromArray({ values: ADDRESSES }),
        toAddress: f.valuesFromArray({ values: ADDRESSES }),
      },
    },
    feedEvent: {
      columns: {
        txHash: f.valuesFromArray({ values: TX_HASHES }),
        type: f.valuesFromArray({ values: FEED_EVENT_TYPES }),
      },
    },
  }));
}

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  },
);
