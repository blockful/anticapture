import type { Repository } from "@/repository/db.interface";
import type { DataProvider } from "@/provider/dataProvider.interface";
import type { OffchainProposal } from "@/repository/schema";

const ACTIVE_STATES = new Set(["pending", "active"]);

export class Indexer {
  private proposalsCursor: string | null = null;
  private votesCursor: string | null = null;

  constructor(
    private readonly repository: Repository,
    private readonly provider: DataProvider,
    private readonly pollingIntervalMs: number,
  ) {}

  async start(forceBackfill: boolean): Promise<void> {
    if (forceBackfill) {
      console.log("Force backfill enabled — resetting cursors");
      await this.repository.resetCursor("proposals");
      await this.repository.resetCursor("votes");
    }

    this.proposalsCursor = await this.repository.getLastCursor("proposals");
    this.votesCursor = await this.repository.getLastCursor("votes");

    console.log(
      `Loaded cursors — proposals: ${this.proposalsCursor ?? "none"}, votes: ${this.votesCursor ?? "none"}`,
    );

    while (true) {
      await this.sync();
      await this.sleep(this.pollingIntervalMs);
    }
  }

  private async sync(): Promise<void> {
    try {
      await this.syncProposals();
    } catch (err) {
      console.error("Error syncing proposals:", err);
    }

    try {
      await this.syncVotes();
    } catch (err) {
      console.error("Error syncing votes:", err);
    }
  }

  private async syncProposals(): Promise<void> {
    const { data } =
      await this.provider.fetchProposals(this.proposalsCursor);

    if (data.length === 0) return;

    this.updateProposalsCursor(data);
    await this.repository.saveProposals(data, this.proposalsCursor ?? "0");

    console.log(`Synced ${data.length} proposals (cursor: ${this.proposalsCursor})`);
  }

  private updateProposalsCursor(proposals: OffchainProposal[]) {
    const firstActiveIdx = proposals.findIndex((p) =>
      ACTIVE_STATES.has(p.state),
    );

    // No active proposals, advance to last
    if (firstActiveIdx === -1) {
      this.proposalsCursor = String(proposals[proposals.length - 1]!.created);
      return;
    }

    // First proposal is already active — don't advance
    if (firstActiveIdx === 0) return;

    // Advance up to the one before the first active
    this.proposalsCursor = String(proposals[firstActiveIdx - 1]!.created);
  }

  private async syncVotes(): Promise<void> {
    const { data, nextCursor } =
      await this.provider.fetchVotes(this.votesCursor);

    if (data.length === 0) return;

    const cursor = nextCursor ?? String(data[data.length - 1]!.created);
    await this.repository.saveVotes(data, cursor);
    this.votesCursor = cursor;

    console.log(`Synced ${data.length} votes (cursor: ${cursor})`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
