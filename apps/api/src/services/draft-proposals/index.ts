import type {
  DBProposalDraft,
  DraftProposalsRepository,
} from "@/repositories/draft-proposals";

export type CreateDraftInput = {
  id: string;
  daoId: string;
  author: string;
  title: string;
  discussionUrl: string;
  body: string;
  actions: unknown[];
};

export type UpdateDraftInput = {
  title?: string;
  discussionUrl?: string;
  body?: string;
  actions?: unknown[];
};

export class DraftProposalsService {
  constructor(private readonly repo: DraftProposalsRepository) {}

  async getDrafts(author: string, daoId: string): Promise<DBProposalDraft[]> {
    return this.repo.findByAuthorAndDao(author, daoId);
  }

  async getDraftById(id: string): Promise<DBProposalDraft | undefined> {
    return this.repo.findById(id);
  }

  async createDraft(input: CreateDraftInput): Promise<DBProposalDraft> {
    const now = BigInt(Date.now());
    return this.repo.create({
      id: input.id,
      daoId: input.daoId,
      author: input.author.toLowerCase(),
      title: input.title,
      discussionUrl: input.discussionUrl,
      body: input.body,
      actions: input.actions,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateDraft(
    id: string,
    author: string,
    input: UpdateDraftInput,
  ): Promise<DBProposalDraft | undefined> {
    return this.repo.update(id, author, {
      ...input,
      updatedAt: BigInt(Date.now()),
    });
  }

  async deleteDraft(id: string, author: string): Promise<boolean> {
    return this.repo.delete(id, author);
  }
}
