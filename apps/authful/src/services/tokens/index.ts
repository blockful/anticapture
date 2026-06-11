import { createHash, randomBytes } from "node:crypto";

import type {
  DBToken,
  TokensRepository,
  UsageEntry,
} from "@/repositories/tokens";

export const TOKEN_PREFIX = "act_";

export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export type MintInput = {
  tenant: string;
  name: string;
  rateLimitPerMin?: number;
  /**
   * Seed path: hash an existing plaintext credential instead of generating a
   * new one. Used to migrate pre-existing shared keys (e.g. Uniswap's current
   * MCP key) into the store without rotating them.
   */
  plaintext?: string;
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
      rateLimitPerMin: number;
    };

export class TokensService {
  constructor(private readonly repo: TokensRepository) {}

  async mint(input: MintInput): Promise<MintedToken> {
    const plaintext =
      input.plaintext ??
      `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
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

  async list(): Promise<DBToken[]> {
    return this.repo.list();
  }

  async revoke(id: string): Promise<boolean> {
    return this.repo.revoke(id);
  }

  async validate(tokenHash: string): Promise<ValidationResult> {
    const token = await this.repo.findActiveByHash(tokenHash);
    if (!token) return { valid: false };
    await this.repo.touchLastUsed(token.id);
    return {
      valid: true,
      tokenId: token.id,
      tenant: token.tenant,
      rateLimitPerMin: token.rateLimitPerMin,
    };
  }

  async recordUsage(entries: UsageEntry[]): Promise<void> {
    // Pre-aggregate by primary key: a single INSERT ... ON CONFLICT cannot
    // affect the same row twice, so duplicate (token, route, hour) entries in
    // one batch must be merged before hitting the database.
    const merged = new Map<string, UsageEntry>();
    for (const entry of entries) {
      const key = `${entry.tokenId}|${entry.route}|${entry.hour.getTime()}`;
      const existing = merged.get(key);
      if (existing) existing.count += entry.count;
      else merged.set(key, { ...entry });
    }
    await this.repo.recordUsage([...merged.values()]);
  }
}
