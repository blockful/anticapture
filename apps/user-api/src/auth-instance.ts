import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

import { createAuthResolver } from "@/auth";
import { db } from "@/database";
import { createMagicLinkSender } from "@/email/magic-link";
import { env } from "@/env";

// Verifies both EOA signatures and EIP-1271 / ERC-6492 smart-contract wallets
// (Safe, etc.). `publicClient.verifyMessage` recovers the signer for EOAs and
// falls back to the on-chain isValidSignature call for contract wallets.
// TODO: governance today is mainnet-only (ENS, SHU). When a draft-enabled DAO
// ships on another chain, resolve the client by the message's chainId.
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(env.RPC_URL),
});

// Each optional method is wired only when its config is present, so the
// service runs SIWE-only until Resend / Google credentials are set.
const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : undefined;

export const authResolver = createAuthResolver({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.TRUSTED_ORIGINS,
  domains: env.AUTH_SIWE_DOMAINS,
  verifyMessage: ({ message, signature, address }) =>
    publicClient.verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    }),
  magicLink: createMagicLinkSender(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL),
  google,
});

// The better-auth CLI introspects this export to generate the schema (which
// is domain-independent), via `pnpm auth:generate`.
export const auth = authResolver.primary;
