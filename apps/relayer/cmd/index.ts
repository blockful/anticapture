import { serve } from "@hono/node-server";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import pino from "pino";
import { createPublicClient, http, type Address, type Chain } from "viem";
import { mainnet, optimism, scroll, arbitrum, zkSync } from "viem/chains";
import { fromZodError } from "zod-validation-error";

import { health } from "@/controllers/health";
import { relayDelegate } from "@/controllers/relay-delegate";
import { relayVote } from "@/controllers/relay-vote";
import { env } from "@/env";
import { RelayError } from "@/errors";
import { RateLimiter } from "@/lib/rate-limiter";
import { ChainStateService } from "@/services/chain-state";
import { EligibilityService } from "@/services/eligibility";
import { RelayService } from "@/services/relay";
import { SignatureVerifier } from "@/services/signature-verifier";
import { createLocalSigner } from "@/signer/local-signer";

const logger = pino({ name: "relayer" });

const CHAINS: Record<number, Chain> = {
  1: mainnet,
  10: optimism,
  534352: scroll,
  42161: arbitrum,
  324: zkSync,
};

async function main() {
  const chain = CHAINS[env.CHAIN_ID];
  if (!chain) throw new Error(`Unsupported chain ID: ${env.CHAIN_ID}`);

  const governorAddress = env.GOVERNOR_ADDRESS as Address;
  const tokenAddress = env.TOKEN_ADDRESS as Address;

  // --- Infrastructure ---
  const publicClient = createPublicClient({
    chain,
    transport: http(env.RPC_URL),
  });

  const signer = createLocalSigner(
    env.RELAYER_PRIVATE_KEY as `0x${string}`,
    chain,
    env.RPC_URL,
  );

  // --- Services ---
  const chainState = new ChainStateService(
    publicClient,
    governorAddress,
    tokenAddress,
  );

  // Read contract names for EIP-712 domains
  const [governorName, tokenName] = await Promise.all([
    chainState.getGovernorName(),
    chainState.getTokenName(),
  ]);

  const signatureVerifier = new SignatureVerifier(
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
  );

  const eligibility = new EligibilityService(chainState, {
    minVotingPower: BigInt(env.MIN_VOTING_POWER),
    delegationCooldownDays: env.DELEGATION_COOLDOWN_DAYS,
  });

  const rateLimiter = new RateLimiter({
    maxPerAddressPerDay: env.MAX_RELAY_PER_ADDRESS_PER_DAY,
    maxPerAddressPerHour: env.MAX_RELAY_PER_ADDRESS_PER_HOUR,
  });

  const minBalanceWei = BigInt(env.MIN_BALANCE_WEI);

  const relayService = new RelayService(
    signer,
    signatureVerifier,
    eligibility,
    chainState,
    rateLimiter,
    publicClient,
    minBalanceWei,
    governorAddress,
    tokenAddress,
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
  if (env.BLOCKFUL_API_TOKEN) {
    app.use(bearerAuth({ token: env.BLOCKFUL_API_TOKEN }));
  }

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
  health(app, signer, publicClient, minBalanceWei);

  // --- OpenAPI docs ---
  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: { title: "Anticapture Relayer", version: "1.0.0" },
  });

  // --- Start ---
  logger.info(
    {
      port: env.PORT,
      chain: chain.name,
      relayer: signer.address,
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
