import { wrapWithTracing } from "@anticapture/observability";
import {
  Abi,
  Account,
  Address,
  Chain,
  Client,
  ContractFunctionArgs,
  ContractFunctionName,
  fromHex,
  toHex,
  Transport,
} from "viem";
import { readContract } from "viem/actions";
import type {
  ReadContractParameters,
  ReadContractReturnType,
} from "viem/actions";

import { logger } from "@/logger";
import { rpcRequestTotal } from "@/metrics";

import { ProposalStatus } from "../lib/constants";

/**
 * Base implementation for EVM Compound-based governance contracts.
 * Provides common functionality for proposal status calculation
 * not handled by the indexing process.
 */

export abstract class GovernorBase<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
> {
  protected cache: {
    proposalThreshold?: bigint;
    votingDelay?: bigint;
    votingPeriod?: bigint;
    timelockDelay?: bigint;
    executionPeriod?: bigint;
  } = {};
  private latestBlockCache:
    | { number: number; timestamp: number | null; expiresAt: number }
    | undefined;
  private latestBlockFetch: Promise<{
    number: number;
    timestamp: number | null;
  }> | null = null;
  private timelockDelayFetch: Promise<bigint> | null = null;
  private readonly quorumCache = new Map<
    string,
    { value: bigint; expiresAt: number }
  >();
  private readonly quorumRefreshes = new Map<string, Promise<void>>();
  private readonly latestBlockCacheTtlMs = 7_000;
  // Backoff after a failed refresh so a degraded RPC is not re-probed on every
  // request while the stale block is being served.
  private readonly latestBlockRetryMs = 3_000;
  private readonly quorumCacheTtlMs: number;

  protected abstract address: Address;
  protected abstract abi: Abi;

  constructor(
    protected client: Client<TTransport, TChain, TAccount>,
    quorumCacheTtlMinutes: number = Infinity,
  ) {
    this.quorumCacheTtlMs = Math.max(1, quorumCacheTtlMinutes) * 60 * 1000;
    wrapWithTracing(this);
  }

  protected async getCachedQuorum(
    fetcher: () => Promise<bigint>,
    cacheKey: string = "quorum",
  ): Promise<bigint> {
    const now = Date.now();
    const cached = this.quorumCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    if (cached) {
      this.refreshCachedQuorum(fetcher, cacheKey);
      return cached.value;
    }

    const quorum = await fetcher();
    this.quorumCache.set(cacheKey, {
      value: quorum,
      expiresAt: now + this.quorumCacheTtlMs,
    });

    return quorum;
  }

  private refreshCachedQuorum(
    fetcher: () => Promise<bigint>,
    cacheKey: string,
  ): void {
    if (this.quorumRefreshes.has(cacheKey)) {
      return;
    }

    const refresh = fetcher()
      .then((quorum) => {
        this.quorumCache.set(cacheKey, {
          value: quorum,
          expiresAt: Date.now() + this.quorumCacheTtlMs,
        });
      })
      .catch((error: Error) => {
        logger.warn({ error, cacheKey }, "Failed to refresh quorum cache");
      })
      .finally(() => {
        this.quorumRefreshes.delete(cacheKey);
      });

    this.quorumRefreshes.set(cacheKey, refresh);
  }

  async getProposalThreshold(): Promise<bigint> {
    if (!this.cache.proposalThreshold) {
      this.cache.proposalThreshold = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "proposalThreshold",
        args: [],
      })) as bigint;
    }
    return this.cache.proposalThreshold!;
  }

  async getVotingDelay(): Promise<bigint> {
    if (!this.cache.votingDelay) {
      this.cache.votingDelay = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "votingDelay",
        args: [],
      })) as bigint;
    }
    return this.cache.votingDelay!;
  }

  async getVotingPeriod(): Promise<bigint> {
    if (!this.cache.votingPeriod) {
      this.cache.votingPeriod = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "votingPeriod",
        args: [],
      })) as bigint;
    }
    return this.cache.votingPeriod!;
  }

  abstract calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint;

  abstract getQuorum(proposalId: string | null): Promise<bigint>;

  /** Uncached timelock delay read (RPC or constant), implemented per DAO. */
  protected abstract fetchTimelockDelay(): Promise<bigint>;

  async getTimelockDelay(): Promise<bigint> {
    if (this.cache.timelockDelay !== undefined) {
      return this.cache.timelockDelay;
    }

    // Share one in-flight fetch across concurrent callers: getProposalStatus
    // runs per proposal, so a cache miss would otherwise fire a burst of
    // eth_calls and trip upstream RPC rate limits.
    if (!this.timelockDelayFetch) {
      this.timelockDelayFetch = this.fetchTimelockDelay()
        .then((delay) => {
          this.cache.timelockDelay = delay;
          return delay;
        })
        .finally(() => {
          this.timelockDelayFetch = null;
        });
    }

    return this.timelockDelayFetch;
  }

  async getGracePeriod(): Promise<bigint | null> {
    return null;
  }

  async getProposalStatus(
    proposal: {
      id: string;
      status: string;
      startBlock: number;
      endBlock: number;
      forVotes: bigint;
      againstVotes: bigint;
      abstainVotes: bigint;
      endTimestamp: bigint;
    },
    currentBlock: number,
    currentTimestamp: number,
  ): Promise<string> {
    let timelockDelay: bigint;
    let gracePeriod: bigint | null;
    try {
      timelockDelay = await this.getTimelockDelay();
      gracePeriod = await this.getGracePeriod();
    } catch (error) {
      // Degrade gracefully on RPC failures (e.g. rate limits): serve the
      // indexed status instead of failing the whole request.
      logger.warn(
        { error, proposalId: proposal.id },
        "RPC read failed while computing proposal status; falling back to indexed status",
      );
      return proposal.status;
    }

    if (
      proposal.status === ProposalStatus.QUEUED &&
      gracePeriod !== null &&
      currentTimestamp &&
      BigInt(currentTimestamp) >=
        proposal.endTimestamp + timelockDelay + gracePeriod
    ) {
      return ProposalStatus.EXPIRED;
    }

    if (
      proposal.status === ProposalStatus.QUEUED &&
      currentTimestamp &&
      BigInt(currentTimestamp) >= proposal.endTimestamp + timelockDelay
    ) {
      return ProposalStatus.PENDING_EXECUTION;
    }

    // Skip proposals already finalized via event
    if (
      [
        ProposalStatus.CANCELED,
        ProposalStatus.VETOED,
        ProposalStatus.QUEUED,
        ProposalStatus.EXECUTED,
      ].includes(proposal.status as ProposalStatus)
    ) {
      return proposal.status;
    }

    if (currentBlock < proposal.startBlock) {
      return ProposalStatus.PENDING;
    }

    if (
      currentBlock >= proposal.startBlock &&
      currentBlock < proposal.endBlock
    ) {
      return ProposalStatus.ACTIVE;
    }

    // After voting period ends
    if (currentBlock >= proposal.endBlock) {
      const proposalQuorum = this.calculateQuorum({
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
      });

      let quorum: bigint;
      try {
        quorum = await this.getQuorum(proposal.id);
      } catch (error) {
        logger.warn(
          { error, proposalId: proposal.id },
          "RPC read failed while computing proposal status; falling back to indexed status",
        );
        return proposal.status;
      }
      const hasQuorum = proposalQuorum >= quorum;
      if (!hasQuorum) return ProposalStatus.NO_QUORUM;

      const voteSum =
        proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

      const hasMajority = proposal.forVotes > proposal.againstVotes;
      if (voteSum > quorum && !hasMajority) return ProposalStatus.DEFEATED;

      return ProposalStatus.SUCCEEDED;
    }

    return proposal.status;
  }

  protected async readContract<
    const TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">,
    TArgs extends ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
  >(
    params: ReadContractParameters<TAbi, TFunctionName, TArgs>,
  ): Promise<ReadContractReturnType<TAbi, TFunctionName, TArgs>> {
    rpcRequestTotal.add(1, { method: "eth_call" });
    logger.info(
      { functionName: params.functionName, address: params.address },
      "RPC eth_call: reading contract",
    );
    return readContract(this.client, params);
  }

  protected async getBlockNumber(): Promise<bigint> {
    const block = await this.getLatestBlock();
    return BigInt(block.number);
  }

  alreadySupportCalldataReview(): boolean {
    return false;
  }

  supportOffchainData(): boolean {
    return false;
  }

  async getCurrentBlockNumber(): Promise<number> {
    const block = await this.getLatestBlock();
    return block.number;
  }

  async getBlockTime(blockNumber: number): Promise<number | null> {
    const cached = this.latestBlockCache;

    if (cached && cached.number === blockNumber) {
      return cached.timestamp;
    }

    rpcRequestTotal.add(1, { method: "eth_getBlockByNumber" });
    logger.info({ blockNumber }, "RPC eth_getBlockByNumber: fetching block");
    const block = await this.client.request({
      method: "eth_getBlockByNumber",
      params: [toHex(blockNumber), false],
    });
    return block?.timestamp ? fromHex(block.timestamp, "number") : null;
  }

  /**
   * Stale-while-revalidate: only the very first call waits for the RPC. Once
   * warm, callers always get the cached block immediately and an expired entry
   * just kicks off a background refresh, so request latency never depends on
   * RPC health and an RPC outage degrades to a slightly stale block instead of
   * a hanging request.
   */
  private async getLatestBlock(): Promise<{
    number: number;
    timestamp: number | null;
  }> {
    const cached = this.latestBlockCache;

    if (!cached) {
      return this.refreshLatestBlock();
    }

    if (cached.expiresAt <= Date.now()) {
      this.refreshLatestBlock().catch(() => {
        // Failure is logged and backed off inside refreshLatestBlock.
      });
    }

    return { number: cached.number, timestamp: cached.timestamp };
  }

  private refreshLatestBlock(): Promise<{
    number: number;
    timestamp: number | null;
  }> {
    if (!this.latestBlockFetch) {
      this.latestBlockFetch = this.fetchLatestBlock()
        .catch((error: Error) => {
          const stale = this.latestBlockCache;
          if (stale) {
            stale.expiresAt = Date.now() + this.latestBlockRetryMs;
            logger.warn(
              { error, blockNumber: stale.number },
              "Failed to refresh latest block; serving stale block",
            );
          }
          throw error;
        })
        .finally(() => {
          this.latestBlockFetch = null;
        });
    }

    return this.latestBlockFetch;
  }

  private async fetchLatestBlock(): Promise<{
    number: number;
    timestamp: number | null;
  }> {
    rpcRequestTotal.add(1, { method: "eth_getBlockByNumber" });
    logger.info("RPC eth_getBlockByNumber: fetching latest block");
    const block = await this.client.request({
      method: "eth_getBlockByNumber",
      params: ["latest", false],
    });

    if (!block?.number) {
      throw new Error("Latest block response missing block number");
    }

    const latestBlock = {
      number: fromHex(block.number, "number"),
      timestamp: block?.timestamp ? fromHex(block.timestamp, "number") : null,
    };

    this.latestBlockCache = {
      ...latestBlock,
      expiresAt: Date.now() + this.latestBlockCacheTtlMs,
    };

    return latestBlock;
  }
}
