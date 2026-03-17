import {
  PROMETHEUS_MIME_TYPE,
  PrometheusSerializer,
} from "@anticapture/observability";
import { serve } from "@hono/node-server";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { drizzle } from "drizzle-orm/node-postgres";
import { logger } from "hono/logger";
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
  ActiveSupplyQueryResult,
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

// AAVE has no governance data
class DummyGovernanceActivityService {
  async getActiveSupply(
    _fromDate: number,
  ): Promise<ActiveSupplyQueryResult | undefined> {
    return {
      activeSupply: "0",
    };
  }
  async getAverageTurnout(_fromDate: number): Promise<{
    currentAverageTurnout: string;
    oldAverageTurnout: string;
    changeRate: number;
  }> {
    return {
      currentAverageTurnout: "0",
      oldAverageTurnout: "0",
      changeRate: 0,
    };
  }
}

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

const daoCache = new DaoCache();

const tokenPriceService = new CoingeckoService(
  env.COINGECKO_API_URL,
  env.COINGECKO_API_KEY,
  env.DAO_ID,
);

const daoService = new DaoService(
  daoClient,
  daoCache,
  env.CHAIN_ID,
  new DummyGovernanceActivityService(),
  tokenPriceService,
);
const votingPowerService = new AAVEVotingPowerService(
  new AAVEVotingPowerRepository(pgClient),
);
const accountBalanceRepo = new AAVEAccountBalanceRepository(
  pgClient,
  new AccountBalanceQueryFragments(pgClient),
);
const accountBalanceService = new AccountBalanceService(accountBalanceRepo);
historicalDelegations(
  app,
  new HistoricalDelegationsService(
    new HistoricalDelegationsRepository(pgClient),
  ),
);

token(
  app,
  tokenPriceService,
  new TokenService(new TokenRepository(pgClient)),
  env.DAO_ID,
);
delegations(app, new DelegationsService(new DelegationsRepository(pgClient)));
delegators(app, new DelegatorsService(new DelegatorsRepository(pgClient)));
historicalBalances(
  app,
  new HistoricalBalancesService(new HistoricalBalanceRepository(pgClient)),
);
historicalVotingPower(app, votingPowerService);
votingPowers(app, votingPowerService);
accountBalances(app, env.DAO_ID, accountBalanceService);
accountInteractions(app, new AccountInteractionsService(accountBalanceRepo));
transfers(app, new TransfersService(new TransfersRepository(pgClient)));
dao(app, daoService);
docs(app);

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  },
);
