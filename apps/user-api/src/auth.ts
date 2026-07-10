import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { generateRandomString } from "better-auth/crypto";
import { magicLink, siwe } from "better-auth/plugins";

import type { UserApiDrizzle } from "@/database/types";

export type VerifySiweMessage = (params: {
  message: string;
  signature: string;
  address: string;
  chainId: number;
}) => Promise<boolean>;

export type SendMagicLink = (params: {
  email: string;
  url: string;
}) => Promise<void>;

export type AuthConfig = {
  db: UserApiDrizzle;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  /**
   * Hosts a SIWE message may be bound to. One better-auth instance is built
   * per entry because the SIWE plugin validates the signed message against
   * exactly one domain — the mechanism that lets each frontend (main +
   * whitelabel) sign with its real host, preserving SIWE's anti-phishing
   * guarantee. Must have at least one entry (env validation enforces it).
   */
  domains: string[];
  /** Signature verifier — injected so tests can verify EOAs offline. */
  verifyMessage: VerifySiweMessage;
  /**
   * Enables magic-link sign-in when provided (email delivery is injected).
   * Omitted (e.g. no email provider configured) leaves the method disabled.
   */
  magicLink?: SendMagicLink;
  /** Enables Google OAuth when the credentials are provided. */
  google?: { clientId: string; clientSecret: string };
};

export type AuthResolver = {
  /**
   * Picks the better-auth instance whose SIWE domain matches the request
   * Host. Returns undefined for hosts outside `domains` so callers can fail
   * closed — an unlisted host must never get a session issued or read.
   */
  resolve: (host: string | undefined) => Auth | undefined;
  /** Instance bound to the first configured domain. */
  primary: Auth;
};

/**
 * The browser-facing host behind the dashboard's /api/user proxy. The proxy
 * sets it so we resolve the right per-host SIWE instance; the direct Host
 * header would be the internal service host, never in AUTH_SIWE_DOMAINS.
 *
 * Prefers the custom x-anticapture-host: when a managed edge (e.g. Railway)
 * sits in front of this service, it overwrites the x-forwarded-* set with its
 * own host, so the proxy's value would be lost. A custom x- header passes
 * through untouched. x-forwarded-host remains the fallback for edge-less
 * setups (local dev).
 */
export const forwardedHost = (
  headers: Pick<Headers, "get">,
): string | undefined =>
  headers.get("x-anticapture-host") ??
  headers.get("x-forwarded-host") ??
  headers.get("host") ??
  undefined;

function createAuth(config: AuthConfig, domain: string) {
  const plugins: BetterAuthPlugin[] = [
    siwe({
      domain,
      // Wallet-only users have no email; better-auth stores a placeholder.
      anonymous: true,
      getNonce: async () => generateRandomString(32, "a-z", "A-Z", "0-9"),
      verifyMessage: async ({ message, signature, address, chainId }) => {
        try {
          return await config.verifyMessage({
            message,
            signature,
            address,
            chainId,
          });
        } catch {
          return false;
        }
      },
    }),
  ];

  if (config.magicLink) {
    const send = config.magicLink;
    plugins.push(
      magicLink({ sendMagicLink: ({ email, url }) => send({ email, url }) }),
    );
  }

  return betterAuth({
    database: drizzleAdapter(config.db, { provider: "pg" }),
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins,
    // No account linking in v1 (product decision): a wallet login and a
    // Google/email login are deliberately separate users.
    ...(config.google
      ? {
          socialProviders: {
            google: {
              clientId: config.google.clientId,
              clientSecret: config.google.clientSecret,
            },
          },
        }
      : {}),
    plugins,
  });
}

// Derived from the concrete return of createAuth (not betterAuth's generic
// default) so instances remain assignable to this alias.
export type Auth = ReturnType<typeof createAuth>;

export function createAuthResolver(config: AuthConfig): AuthResolver {
  const [primaryDomain, ...otherDomains] = config.domains as [
    string,
    ...string[],
  ];

  const primary = createAuth(config, primaryDomain);

  // Instances are cheap — they share the DB and secret; only the SIWE domain
  // differs, so sessions issued via one host validate on any of them.
  const instances = new Map<string, Auth>([
    [primaryDomain, primary],
    ...otherDomains.map(
      (domain) => [domain, createAuth(config, domain)] as const,
    ),
  ]);

  return {
    resolve: (host) => (host ? instances.get(host) : undefined),
    primary,
  };
}
