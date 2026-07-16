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

export class ProposalDraftsService {
  constructor(
    private readonly repo: DraftsRepository,
    private readonly maxDraftsPerUser = DEFAULT_MAX_DRAFTS_PER_USER,
  ) {}

  /**
   * "Claiming" = attaching ownership: legacy drafts were migrated from the
   * per-DAO databases with `user_id NULL` and only the author's wallet in
   * `author_address` (accounts didn't exist back then). When a signed-in
   * user touches drafts, any still-unowned row authored by one of their
   * wallets is attached (claimed) to their account. Runs on EVERY entry
   * point (list, direct share view, update, delete) — claim-on-first-touch —
   * and stays idempotent per request: no process-local memo, because the
   * one-shot migration script may insert claimable rows AFTER a user was
   * first seen. Returns the user's wallets for callers that need them.
   */
  private async claimMigrated(userId: string): Promise<string[]> {
    const wallets = await this.repo.findWalletAddresses(userId);
    await this.repo.claimByAddresses(userId, wallets);
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
