import "./instrumentation";
import { serve } from "@hono/node-server";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import {
  createLogger,
  PROMETHEUS_MIME_TYPE,
  PrometheusSerializer,
  wrapWithTracing,
} from "@anticapture/observability";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { fromZodError } from "zod-validation-error";

import { health } from "@/controllers/health";
import { relayDelegate } from "@/controllers/relay-delegate";
import { relayVote } from "@/controllers/relay-vote";
import { env } from "@/env";
import { RelayError } from "@/errors";
import { createClient } from "redis";
import { RedisRateLimitStorage } from "@/repository/rate-limit-storage";
import { RateLimiter } from "@/services/guards/rate-limiter";
import { ChainStateService } from "@/services/chain/chain-state";
import { RelayService } from "@/services/relay";
import { SignatureVerifier } from "@/services/guards/signature-verifier";
import { createLocalSigner } from "@/signer/local-signer";
import { exporter } from "@/instrumentation";

const logger = createLogger("anticapture-relayer");

async function main() {
  const chain = mainnet;

  const governorAddress = env.GOVERNOR_ADDRESS;
  const tokenAddress = env.TOKEN_ADDRESS;

  // --- Infrastructure ---
  const publicClient = createPublicClient({
    chain,
    transport: http(env.RPC_URL),
  });

  const signer = createLocalSigner(env.RELAYER_PRIVATE_KEY, chain, env.RPC_URL);

  // --- Services ---
  const chainState = wrapWithTracing(
    new ChainStateService(publicClient, governorAddress, tokenAddress),
  );

  // Read contract names for EIP-712 domains
  const [governorName, tokenName] = await Promise.all([
    chainState.getGovernorName(),
    chainState.getTokenName(),
  ]);

  const signatureVerifier = wrapWithTracing(
    new SignatureVerifier(
      {
        name: governorName,
        version: "1",
        chainId: env.CHAIN_ID,
        verifyingContract: governorAddress,
      },
      {
        name: tokenName,
        version: "1",
        chainId: env.CHAIN_ID,
        verifyingContract: tokenAddress,
      },
    ),
  );

  const redis = createClient({ url: env.REDIS_URL });
  redis.on("error", (err: Error) => logger.error({ err }, "[redis] error"));
  await redis.connect();

  const rateLimitStorage = wrapWithTracing(new RedisRateLimitStorage(redis));

  const rateLimiter = wrapWithTracing(
    new RateLimiter(rateLimitStorage, {
      daoName: env.DAO_NAME,
      governorAddress: governorAddress,
      maxPerAddressPerDay: env.MAX_RELAY_PER_ADDRESS_PER_DAY,
    }),
  );

  const relayService = wrapWithTracing(
    new RelayService(
      signer,
      signatureVerifier,
      chainState,
      rateLimiter,
      publicClient,
      BigInt(env.MIN_VOTING_POWER),
      governorAddress,
      tokenAddress,
    ),
  );

  // --- App ---
  const app = new Hono({
    defaultHook: (result, c) => {
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return c.json(
          { error: validationError.message, code: "VALIDATION_ERROR" },
          400,
        );
      }
    },
  });

  app.use(cors({ origin: "*" }));

  app.get("/metrics", async (c) => {
    const result = await exporter.collect();
    const serialized = new PrometheusSerializer().serialize(
      result.resourceMetrics,
    );
    return c.text(serialized, 200, { "Content-Type": PROMETHEUS_MIME_TYPE });
  });

  // Request logging
  app.use(async (c, next) => {
    const start = Date.now();
    await next();
    logger.info(
      {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - start,
      },
      "request",
    );
  });

  // Global error handler
  app.onError((err, c) => {
    if (err instanceof RelayError) {
      return c.json({ error: err.message, code: err.code }, err.status as 400);
    }
    logger.error({ err }, "Unhandled error");
    return c.json({ error: "Internal server error", code: "INTERNAL" }, 500);
  });

  // --- Routes ---
  relayVote(app, relayService);
  relayDelegate(app, relayService);
  health(app);

  // --- OpenAPI docs ---
  app.doc("/docs", {
    openapi: "3.0.0",
    info: { title: "Anticapture Relayer", version: "1.0.0" },
  });

  // --- Start ---
  logger.info(
    {
      port: env.PORT,
      chain: chain.name,
      relayer: await signer.getAddress(),
      governor: governorAddress,
      token: tokenAddress,
    },
    "Relayer starting",
  );

  serve({ fetch: app.fetch, port: env.PORT });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start relayer");
  process.exit(1);
});
