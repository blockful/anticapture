import type {
  CreateDraftInput,
  DraftRow,
  DraftsRepository,
  UpdateDraftInput,
} from "@/repositories/drafts";

export const DEFAULT_MAX_DRAFTS_PER_USER = 100;

export class DraftQuotaExceededError extends Error {
  constructor(readonly limit: number) {
    super(`draft limit of ${limit} reached`);
    this.name = "DraftQuotaExceededError";
  }
}

export class DraftsService {
  constructor(
    private readonly repo: DraftsRepository,
    private readonly maxDraftsPerUser = DEFAULT_MAX_DRAFTS_PER_USER,
  ) {}

  /**
   * Users whose migrated rows this process already claimed. Claimable rows
   * are the fixed pre-migration set (new drafts are born with a userId) and
   * a user's wallet set is settled at SIWE sign-up (no linking in v1), so
   * one successful claim settles the user forever — later requests skip the
   * claim UPDATE. Process-local: a restart just re-claims once, so this
   * stays correct even if wallet linking ships later.
   */
  private readonly claimed = new Set<string>();

  /**
   * Adopts migrated rows (userId NULL) authored by one of this user's
   * wallets — claim-on-first-touch, so ownership is settled on EVERY entry
   * point (list, direct share view, update, delete), not just the list.
   * Idempotent. Returns the user's wallets for callers that need them.
   */
  private async claimMigrated(userId: string): Promise<string[]> {
    const wallets = await this.repo.findWalletAddresses(userId);
    if (!this.claimed.has(userId)) {
      await this.repo.claimByAddresses(userId, wallets);
      // Guard against unbounded growth across a very long process life.
      if (this.claimed.size >= 10_000) this.claimed.clear();
      this.claimed.add(userId);
    }
    return wallets;
  }

  async listForUser(userId: string, daoId: string): Promise<DraftRow[]> {
    await this.claimMigrated(userId);
    return this.repo.listByUserAndDao(userId, daoId);
  }

  /**
   * Share read. When a session is present, migrated rows are claimed first
   * so `isOwner` is correct even when this is the user's very first request
   * after the migration.
   */
  async getById(
    id: string,
    viewerId: string | null,
  ): Promise<DraftRow | undefined> {
    if (viewerId) await this.claimMigrated(viewerId);
    return this.repo.findById(id);
  }

  async create(
    input: Omit<CreateDraftInput, "authorAddress">,
  ): Promise<DraftRow> {
    // Claimed rows count toward the quota, like everywhere else.
    const [primaryWallet] = await this.claimMigrated(input.userId);

    // Recorded for display on shared drafts (and as the claim key shape used
    // by migrated rows). Email/Google authors simply have none.
    const row = await this.repo.createWithinQuota(
      { ...input, authorAddress: primaryWallet ?? null },
      this.maxDraftsPerUser,
    );
    if (!row) throw new DraftQuotaExceededError(this.maxDraftsPerUser);
    return row;
  }

  async update(
    id: string,
    userId: string,
    patch: UpdateDraftInput,
  ): Promise<DraftRow | undefined> {
    await this.claimMigrated(userId);
    return this.repo.update(id, userId, patch);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    await this.claimMigrated(userId);
    return this.repo.delete(id, userId);
  }
}
