import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

import { relayDelegate } from "@/controllers/relay-delegate";
import { relayVote } from "@/controllers/relay-vote";
import { RelayError } from "@/errors";
import { ChainStateService } from "@/services/chain/chain-state";
import { RateLimiter } from "@/services/guards/rate-limiter";
import { RelayService } from "@/services/relay";
import { SignatureVerifier } from "@/services/guards/signature-verifier";
import { createLocalSigner } from "@/signer/local-signer";

import { GOVERNOR_ADDRESS, RELAYER_KEY, TOKEN_ADDRESS } from "./constants";

export async function createTestApp(rpcUrl: string) {
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });

  const signer = createLocalSigner(RELAYER_KEY, mainnet, rpcUrl);

  const chainState = new ChainStateService(
    publicClient,
    GOVERNOR_ADDRESS,
    TOKEN_ADDRESS,
  );

  const [governorName, tokenName] = await Promise.all([
    chainState.getGovernorName(),
    chainState.getTokenName(),
  ]);

  const signatureVerifier = new SignatureVerifier(
    {
      name: governorName,
      version: "1",
      chainId: 1,
      verifyingContract: GOVERNOR_ADDRESS,
    },
    {
      name: tokenName,
      version: "1",
      chainId: 1,
      verifyingContract: TOKEN_ADDRESS,
    },
  );

  const rateLimiter = new RateLimiter(
    { incrementIfAllowed: async () => true },
    {
      daoName: "test",
      governorAddress: GOVERNOR_ADDRESS,
      maxPerAddressPerDay: 50,
    },
  );

  const relayService = new RelayService(
    signer,
    signatureVerifier,
    chainState,
    rateLimiter,
    publicClient,
    1n,
    1_000_000_000_000_000_000_000n,
    GOVERNOR_ADDRESS,
    TOKEN_ADDRESS,
  );

  const app = new Hono();

  app.onError((err, c) => {
    if (err instanceof RelayError) {
      return c.json({ error: err.message, code: err.code }, err.status as 400);
    }
    return c.json({ error: "Internal server error", code: "INTERNAL" }, 500);
  });

  relayDelegate(app, relayService);
  relayVote(app, relayService);

  return app;
}
