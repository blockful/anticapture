import { createHash, randomBytes } from "node:crypto";

import { tokenValidationRequestTotal } from "@/metrics";
import { USER_TENANT_PREFIX } from "@/middlewares/token-auth";
import type {
  DBToken,
  TokensRepository,
  TokenUsage,
  TokenUsageIncrement,
} from "@/repositories/tokens";

export const TOKEN_PREFIX = "act_";

export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export type MintInput = {
  tenant: string;
  name: string;
  rateLimitPerMin?: number;
};

export type MintedToken = {
  token: DBToken;
  /** Returned exactly once at mint time; only the hash is persisted. */
  plaintext: string;
};

export type ValidationResult =
  | { valid: false }
  | {
      valid: true;
      tokenId: string;
      tenant: string;
      name: string;
      rateLimitPerMin: number;
    };

export class TokensService {
  constructor(private readonly repo: TokensRepository) {}

  async mint(input: MintInput): Promise<MintedToken> {
    const plaintext = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
    const token = await this.repo.create({
      tenant: input.tenant,
      name: input.name,
      tokenHash: hashToken(plaintext),
      ...(input.rateLimitPerMin !== undefined
        ? { rateLimitPerMin: input.rateLimitPerMin }
        : {}),
    });
    return { token, plaintext };
  }

  /**
   * Register a token with a known plaintext (CI/preview bootstrap) so every
   * service in the same environment shares a working key. Idempotent: a no-op
   * when an active token with this value already exists, so it survives
   * restarts and re-deploys. The plaintext capability is internal only — it is
   * never exposed on the admin API.
   */
  async seed(input: {
    tenant: string;
    name: string;
    plaintext: string;
  }): Promise<{ created: boolean; token: DBToken }> {
    const tokenHash = hashToken(input.plaintext);
    const existing = await this.repo.findActiveByHash(tokenHash);
    if (existing) return { created: false, token: existing };
    // rateLimitPerMin is omitted on purpose — the column defaults to 600 at the
    // DB level, which is plenty for an ephemeral preview.
    const token = await this.repo.create({
      tenant: input.tenant,
      name: input.name,
      tokenHash,
    });
    return { created: true, token };
  }

  async list(
    tenant?: string,
    opts: { activeOnly?: boolean } = {},
  ): Promise<DBToken[]> {
    if (!tenant) return this.repo.list();
    return opts.activeOnly
      ? this.repo.listActiveByTenant(tenant)
      : this.repo.listByTenant(tenant);
  }

  /**
   * Revokes a token. When `requireTenantPrefix` is given (provisioning scope),
   * a token whose tenant lacks that prefix is treated as not-found (404) rather
   * than 403 — so the provisioning key can't probe for first-party token ids.
   */
  async revoke(
    id: string,
    opts: { requireTenantPrefix?: string } = {},
  ): Promise<boolean> {
    if (opts.requireTenantPrefix !== undefined) {
      const token = await this.repo.findById(id);
      if (!token || !token.tenant.startsWith(opts.requireTenantPrefix)) {
        return false;
      }
    }
    return this.repo.revoke(id);
  }

  async validate(tokenHash: string): Promise<ValidationResult> {
    const token = await this.repo.findActiveByHash(tokenHash);
    if (!token) {
      tokenValidationRequestTotal.add(1, { result: "invalid" });
      return { valid: false };
    }
    await this.repo.touchLastUsed(token.id);
    tokenValidationRequestTotal.add(1, {
      // Self-service keys mint one `user:<id>` tenant per user — unbounded.
      // Bucket them so the Prometheus label set stays bounded; ops tenants
      // keep their verbatim label. Mirrors gateful's usage middleware.
      tenant: token.tenant.startsWith(USER_TENANT_PREFIX)
        ? `${USER_TENANT_PREFIX}*`
        : token.tenant,
      name: token.name,
      result: "valid",
    });
    return {
      valid: true,
      tokenId: token.id,
      tenant: token.tenant,
      name: token.name,
      rateLimitPerMin: token.rateLimitPerMin,
    };
  }

  async recordUsage(
    idempotencyKey: string,
    items: TokenUsageIncrement[],
    options: { requireTenantPrefix?: string } = {},
  ): Promise<void> {
    await this.repo.incrementUsage(idempotencyKey, items, options);
  }

  async usageByTenant(tenant: string): Promise<TokenUsage[]> {
    return this.repo.listUsageByTenant(tenant);
  }
}
