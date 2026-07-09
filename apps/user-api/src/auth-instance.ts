import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

import { createAuthResolver } from "@/auth";
import { db } from "@/database";
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
});

// The better-auth CLI introspects this export to generate the schema (which
// is domain-independent), via `pnpm auth:generate`.
export const auth = authResolver.primary;
