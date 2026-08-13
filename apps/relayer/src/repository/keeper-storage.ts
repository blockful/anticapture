import { getAddress } from "viem";
import type { Address } from "viem";

import type {
  KeeperStorage,
  TrackedProposal,
} from "@/services/keeper/proposal-lifecycle";

export interface KeeperRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  hSet(key: string, field: string, value: string): Promise<number>;
  hGetAll(key: string): Promise<Record<string, string>>;
  hDel(key: string, field: string): Promise<number>;
}

/**
 * Redis-backed keeper state: a block cursor marking how far ProposalCreated
 * logs have been scanned, and a hash of tracked proposals keyed by proposal id.
 * TrackedProposal stores bigints as decimal strings, so plain JSON round-trips.
 */
export class RedisKeeperStorage implements KeeperStorage {
  private readonly cursorKey: string;
  private readonly proposalsKey: string;

  constructor(
    private redis: KeeperRedisClient,
    daoName: string,
    governorAddress: Address,
  ) {
    const base = `keeper:${daoName}:${getAddress(governorAddress)}`;
    this.cursorKey = `${base}:cursor`;
    this.proposalsKey = `${base}:proposals`;
  }

  async getCursor(): Promise<bigint | null> {
    const raw = await this.redis.get(this.cursorKey);
    return raw === null ? null : BigInt(raw);
  }

  async setCursor(block: bigint): Promise<void> {
    await this.redis.set(this.cursorKey, block.toString());
  }

  async putProposal(proposal: TrackedProposal): Promise<void> {
    await this.redis.hSet(
      this.proposalsKey,
      proposal.proposalId,
      JSON.stringify(proposal),
    );
  }

  async listProposals(): Promise<TrackedProposal[]> {
    const entries = await this.redis.hGetAll(this.proposalsKey);
    return Object.values(entries).map(
      (raw) => JSON.parse(raw) as TrackedProposal,
    );
  }

  async removeProposal(proposalId: string): Promise<void> {
    await this.redis.hDel(this.proposalsKey, proposalId);
  }
}
