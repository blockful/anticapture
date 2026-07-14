import type { AuthfulClient } from "@/clients/authful";
import type { ApiKeyRow, ApiKeysRepository } from "@/repositories/api-keys";

export const DEFAULT_MAX_KEYS_PER_USER = 10;

export const USER_TENANT_PREFIX = "user:";

export class ApiKeyQuotaExceededError extends Error {
  constructor(readonly limit: number) {
    super(`API key limit of ${limit} reached`);
    this.name = "ApiKeyQuotaExceededError";
  }
}

export type CreatedApiKey = {
  key: ApiKeyRow;
  /** Plaintext from Authful — returned to the caller exactly once. */
  plaintext: string;
};

export type ApiKeyWithUsage = ApiKeyRow & { lastUsedAt: string | null };

export class ApiKeysService {
  constructor(
    private readonly repo: ApiKeysRepository,
    private readonly authful: AuthfulClient,
    private readonly maxKeysPerUser = DEFAULT_MAX_KEYS_PER_USER,
  ) {}

  async create(userId: string, label: string): Promise<CreatedApiKey> {
    // Fast-path reject at the cap without minting anything. Not
    // authoritative — the quota is enforced atomically at insert time.
    const current = await this.repo.countActiveByUser(userId);
    if (current >= this.maxKeysPerUser) {
      throw new ApiKeyQuotaExceededError(this.maxKeysPerUser);
    }

    // Mint in Authful under this user's own tenant, then record ownership.
    const minted = await this.authful.mint(
      `${USER_TENANT_PREFIX}${userId}`,
      label,
    );

    try {
      const key = await this.repo.createWithinQuota(
        { userId, authfulTokenId: minted.id, label },
        this.maxKeysPerUser,
      );
      if (!key) {
        // Lost a concurrent race to the last slot — release the minted token.
        await this.authful.revoke(minted.id).catch(() => undefined);
        throw new ApiKeyQuotaExceededError(this.maxKeysPerUser);
      }
      return { key, plaintext: minted.token };
    } catch (err) {
      // Don't leak an orphan usable token if the ownership write fails (the
      // quota branch above has already revoked its own mint).
      if (!(err instanceof ApiKeyQuotaExceededError)) {
        await this.authful.revoke(minted.id).catch(() => undefined);
      }
      throw err;
    }
  }

  async list(userId: string): Promise<ApiKeyWithUsage[]> {
    // lastUsedAt lives in Authful. Enrich best-effort: if Authful is
    // unreachable, still return the keys (usage shown as unknown) rather than
    // failing the whole list. Both lookups depend only on userId, so the DB
    // read and the Authful round-trip run concurrently.
    const [rows, usage] = await Promise.all([
      this.repo.listActiveByUser(userId),
      this.authful
        .listByTenant(`${USER_TENANT_PREFIX}${userId}`)
        .then((tokens) => new Map(tokens.map((t) => [t.id, t.lastUsedAt])))
        .catch(() => new Map<string, string | null>()),
    ]);

    return rows.map((row) => ({
      ...row,
      lastUsedAt: usage.get(row.authfulTokenId) ?? null,
    }));
  }

  /**
   * Revokes a key the user owns. Revokes in Authful first (the security-
   * relevant step) so a failure there aborts before we mark it revoked
   * locally — never the reverse, which would leave a live token the user
   * believes is gone. Returns false if the key isn't found or isn't theirs.
   */
  async revoke(id: string, userId: string): Promise<boolean> {
    const key = await this.repo.findOwned(id, userId);
    if (!key || key.revokedAt) return false;

    await this.authful.revoke(key.authfulTokenId);
    return this.repo.markRevoked(id, userId);
  }
}
