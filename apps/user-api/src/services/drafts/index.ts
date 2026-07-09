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
   * Lists the session user's drafts for a DAO. Also adopts migrated rows
   * whose author wallet belongs to this user (claim-on-first-login) so the
   * list is complete from the first sign-in after the migration.
   */
  async listForUser(userId: string, daoId: string): Promise<DraftRow[]> {
    const wallets = await this.repo.findWalletAddresses(userId);
    await this.repo.claimByAddresses(userId, wallets);
    return this.repo.listByUserAndDao(userId, daoId);
  }

  async getById(id: string): Promise<DraftRow | undefined> {
    return this.repo.findById(id);
  }

  async create(
    input: Omit<CreateDraftInput, "authorAddress">,
  ): Promise<DraftRow> {
    const current = await this.repo.countByUser(input.userId);
    if (current >= this.maxDraftsPerUser) {
      throw new DraftQuotaExceededError(this.maxDraftsPerUser);
    }

    // Recorded for display on shared drafts (and as the claim key shape used
    // by migrated rows). Email/Google authors simply have none.
    const [primaryWallet] = await this.repo.findWalletAddresses(input.userId);

    return this.repo.create({ ...input, authorAddress: primaryWallet ?? null });
  }

  async update(
    id: string,
    userId: string,
    patch: UpdateDraftInput,
  ): Promise<DraftRow | undefined> {
    return this.repo.update(id, userId, patch);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    return this.repo.delete(id, userId);
  }
}
