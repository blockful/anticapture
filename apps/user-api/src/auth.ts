import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { generateRandomString } from "better-auth/crypto";
import { siwe } from "better-auth/plugins";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

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

// Shared across every per-host instance below — same DB, same adapter.
const database = drizzleAdapter(db, { provider: "pg" });

export type Auth = ReturnType<typeof createAuth>;

/**
 * Builds a better-auth instance bound to a single SIWE `domain`. We create one
 * per allowed host (see resolver below) because the SIWE plugin validates the
 * signed message against exactly one domain — the mechanism that makes each
 * frontend (main + whitelabel) sign with its real host and keeps SIWE's
 * anti-phishing guarantee intact.
 */
export function createAuth(domain: string) {
  return betterAuth({
    database,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.TRUSTED_ORIGINS,
    plugins: [
      siwe({
        domain,
        // Wallet-only users have no email; better-auth stores a placeholder.
        anonymous: true,
        getNonce: async () => generateRandomString(32, "a-z", "A-Z", "0-9"),
        verifyMessage: async ({ message, signature, address }) => {
          try {
            return await publicClient.verifyMessage({
              address: address as `0x${string}`,
              message,
              signature: signature as `0x${string}`,
            });
          } catch {
            return false;
          }
        },
      }),
    ],
  });
}

// env validation guarantees at least one entry.
const [primaryDomain, ...otherDomains] = env.AUTH_SIWE_DOMAINS as [
  string,
  ...string[],
];

// Representative instance for tooling: the better-auth CLI introspects this
// export to generate the schema (which is domain-independent). It doubles as
// the primary host's instance. Request handling uses resolveAuth() per host.
export const auth = createAuth(primaryDomain);

// One instance per allowed SIWE host. Instances are cheap — they share the
// adapter, DB, and secret; only the SIWE domain differs.
const instances = new Map<string, Auth>([
  [primaryDomain, auth],
  ...otherDomains.map((domain) => [domain, createAuth(domain)] as const),
]);

/**
 * Picks the better-auth instance whose SIWE domain matches the request Host.
 * Returns undefined for hosts outside AUTH_SIWE_DOMAINS so the caller can fail
 * closed — an unlisted host must never get a session issued.
 */
export function resolveAuth(host: string | undefined): Auth | undefined {
  return host ? instances.get(host) : undefined;
}
