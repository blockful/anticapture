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
  /**
   * Allowed frontend hosts (main dashboard, localhost for local dev, and each
   * whitelabel host). This one list drives everything per host: the SIWE
   * `domain` a signed message must match, the better-auth `baseURL` (so the
   * session cookie and CSRF are scoped to the origin the request actually came
   * from — never a single hard-coded domain), and the trusted-origin allowlist.
   * One better-auth instance is built per entry. Must have at least one entry
   * (env validation enforces it).
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
  /**
   * Railway PR previews only: resolve better-auth instances on demand for
   * *.vercel.app hosts (each Vercel preview URL is unique, so a static
   * allowlist can't cover them). Must NEVER be enabled on dev/production —
   * the caller derives it from the Railway environment name, not from
   * configuration, so it can't drift on.
   */
  previewDynamicHosts?: boolean;
};

/** Hosts eligible for on-demand instances in preview mode. */
const isPreviewHost = (host: string): boolean =>
  /^[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i.test(host);

/** Ceiling for cached dynamic instances (scanner-junk guard). */
const MAX_DYNAMIC_INSTANCES = 100;

/**
 * Which sign-in methods this deployment actually serves. SIWE is always on;
 * the optional ones mirror the exact config presence that registers their
 * plugin, so a frontend reading this never renders a button whose endpoint
 * would 404.
 */
export type AuthMethods = {
  siwe: true;
  magicLink: boolean;
  google: boolean;
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
  /** Sign-in methods enabled by this deployment's configuration. */
  methods: AuthMethods;
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

/**
 * The browser-visible origin for a frontend host. Localhost is served over
 * http (dev); every other host is https. Used as each better-auth instance's
 * baseURL so cookies/CSRF are scoped to the requesting frontend's own origin.
 */
export const originForHost = (host: string): string =>
  /^(localhost|127\.0\.0\.1)(:|$)/.test(host)
    ? `http://${host}`
    : `https://${host}`;

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
    // Per-host origin: the session cookie and CSRF scope to the frontend that
    // made the request, so the same service serves localhost, the main domain,
    // and every whitelabel host correctly. All origins are trusted so a
    // session issued via one instance is accepted by the others.
    baseURL: originForHost(domain),
    // The instance's own domain is always trusted — for static instances it
    // is already in the list; for preview-mode dynamic instances (a unique
    // *.vercel.app host) it is what makes CSRF checks pass on that host.
    trustedOrigins: [...new Set([...config.domains, domain])].map(
      originForHost,
    ),
    // No wallet⟷email linking in v1 (product decision): a wallet login and a
    // Google/email login are deliberately separate users (SIWE users carry a
    // placeholder email, so they never collide). Same-email methods DO link:
    // magic link and Google with one email converge on one user, and the
    // link copies the provider's name/photo onto the local profile (local
    // email/emailVerified are never touched) so a magic-link-born account
    // still gets the Google picture.
    account: { accountLinking: { updateUserInfoOnLink: true } },
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
  // Instances are cheap — they share the DB and secret; only the SIWE domain
  // differs, so sessions issued via one host validate on any of them.
  const instances = new Map<string, Auth>(
    config.domains.map((domain) => [domain, createAuth(config, domain)]),
  );
  // domains is non-empty by env validation.
  const primary = instances.get(config.domains[0]!)!;

  const resolve = (host: string | undefined): Auth | undefined => {
    if (!host) return undefined;
    const existing = instances.get(host);
    if (existing) return existing;

    // Preview envs only: every Vercel preview deployment gets a unique URL,
    // so instances for them are built on demand. Anything that isn't a
    // *.vercel.app host still fails closed, exactly like dev/production.
    if (!config.previewDynamicHosts || !isPreviewHost(host)) return undefined;

    const dynamic = createAuth(config, host);
    if (instances.size < MAX_DYNAMIC_INSTANCES) instances.set(host, dynamic);
    return dynamic;
  };

  return {
    resolve,
    primary,
    methods: {
      siwe: true,
      magicLink: Boolean(config.magicLink),
      google: Boolean(config.google),
    },
  };
}
