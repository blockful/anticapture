import { logger } from "@/logger";
import type { DataProvider } from "@/provider/dataProvider.interface";
import type { Repository } from "@/repository/db.interface";
import type { OffchainProposal } from "@/repository/schema";

const ACTIVE_STATES = new Set(["pending", "active"]);
const PROPOSAL_METADATA_BACKFILL_BATCH_SIZE = 100;
const PROPOSAL_METADATA_BACKFILL_ENTITY = "proposal_metadata_backfill";

// Only reconcile (and delete) proposals created within this window. Bounds both
// the Snapshot fetch and the DB scan so reconciliation can't overwhelm either.
// (backfillProposalMetadata below covers the rest of history separately.)
const RECONCILE_WINDOW_SECONDS = 14 * 24 * 60 * 60;

export class Indexer {
  private proposalsCursor: string | null = null;
  private votesCursor: string | null = null;
  private proposalMetadataBackfillCursor: string | null = null;

  constructor(
    private readonly repository: Repository,
    private readonly provider: DataProvider,
    private readonly pollingIntervalMs: number,
  ) {}

  async start(forceBackfill: boolean): Promise<void> {
    if (forceBackfill) {
      logger.info(
        "force backfill enabled — clearing data and resetting cursors",
      );
      await this.repository.clearVotes();
      await this.repository.clearProposals();
      await this.repository.resetCursor("proposals");
      await this.repository.resetCursor("votes");
    }

    this.proposalsCursor = await this.repository.getLastCursor("proposals");
    this.votesCursor = await this.repository.getLastCursor("votes");
    this.proposalMetadataBackfillCursor = await this.repository.getLastCursor(
      PROPOSAL_METADATA_BACKFILL_ENTITY,
    );

    logger.info(
      {
        proposalsCursor: this.proposalsCursor ?? "none",
        votesCursor: this.votesCursor ?? "none",
        proposalMetadataBackfillCursor:
          this.proposalMetadataBackfillCursor ?? "none",
      },
      "loaded cursors",
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
      logger.error(
        { err, cursor: this.proposalsCursor },
        "error syncing proposals - will retry",
      );
    }

    try {
      await this.reconcileProposals();
    } catch (err) {
      logger.error({ err }, "error reconciling proposals - will retry");
    }

    try {
      await this.backfillProposalMetadata();
    } catch (err) {
      logger.error({ err }, "error backfilling proposal metadata - will retry");
    }

    try {
      await this.syncVotes();
    } catch (err) {
      logger.error(
        { err, cursor: this.votesCursor },
        "error syncing votes - will retry",
      );
    }
  }

  private async syncProposals(): Promise<void> {
    const { data } = await this.provider.fetchProposals(this.proposalsCursor);

    if (data.length === 0) return;

    this.updateProposalsCursor(data);
    await this.repository.saveProposals(data, this.proposalsCursor ?? "0");

    logger.info(
      { count: data.length, cursor: this.proposalsCursor },
      "synced proposals",
    );
  }

  private async reconcileProposals(): Promise<void> {
    const since = Math.floor(Date.now() / 1000) - RECONCILE_WINDOW_SECONDS;
    const liveIds = await this.provider.fetchProposalIdsSince(since);

    if (liveIds.length === 0) {
      logger.warn(
        "snapshot returned no proposals - skipping proposal reconciliation",
      );
      return;
    }

    const liveIdSet = new Set(liveIds);
    const dbIds = await this.repository.getProposalIdsSince(since);
    const deletedIds = dbIds.filter((id) => !liveIdSet.has(id));

    if (deletedIds.length === 0) return;

    await this.repository.deleteProposals(deletedIds);
    logger.info(
      { count: deletedIds.length, ids: deletedIds },
      "removed proposals deleted from snapshot",
    );
  }

  // Walks every proposal by (created, id) cursor, across all history — not
  // windowed like reconcileProposals above — and deletes rows Snapshot no
  // longer returns for the batch, cascading to their votes.
  private async backfillProposalMetadata(): Promise<void> {
    const { ids, nextCursor } =
      await this.repository.getProposalMetadataBackfillBatch(
        this.proposalMetadataBackfillCursor,
        PROPOSAL_METADATA_BACKFILL_BATCH_SIZE,
      );

    if (!nextCursor) return;

    const proposals = await this.provider.fetchProposalsByIds(ids);
    const proposalById = new Map(
      proposals.map((proposal) => [proposal.id, proposal]),
    );
    const missingIds = ids.filter((id) => !proposalById.has(id));

    if (missingIds.length > 0) {
      await this.repository.deleteProposals(missingIds);
    }

    await this.repository.saveProposalMetadataBackfill(proposals, nextCursor);
    this.proposalMetadataBackfillCursor = nextCursor;

    logger.info(
      {
        count: proposals.length,
        deleted: missingIds.length,
        scanned: ids.length,
        cursor: nextCursor,
      },
      "backfilled proposal metadata",
    );
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
    const { data, nextCursor } = await this.provider.fetchVotes(
      this.votesCursor,
    );

    if (data.length === 0) return;

    const cursor = nextCursor ?? String(data[data.length - 1]!.created);
    await this.repository.saveVotes(data, cursor);
    this.votesCursor = cursor;

    logger.info({ count: data.length, cursor }, "synced votes");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
