import { createHash, randomBytes } from "node:crypto";

import type { DBToken, TokensRepository } from "@/repositories/tokens";

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
}
