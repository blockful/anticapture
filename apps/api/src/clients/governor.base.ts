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
    | {
        number: number;
        timestamp: number | null;
        fetchedAt: number;
        expiresAt: number;
      }
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
  private readonly quorumFetches = new Map<string, Promise<bigint>>();
  private readonly latestBlockCacheTtlMs = 7_000;
  // Backoff after a failed refresh so a degraded RPC is not re-probed on every
  // request while the stale block is being served.
  private readonly latestBlockRetryMs = 3_000;
  // Upper bound on how old a served block may be. Past it the cache is no
  // longer trusted to compute proposal statuses (a proposal whose endBlock
  // passed would still read ACTIVE): callers wait for a real RPC read and a
  // failure surfaces, so services fall back to indexed statuses and /health
  // reports the chain head as unavailable.
  private readonly latestBlockMaxStaleMs = 60_000;
  // Earliest time a failed latest-block read may be retried. Kept outside the
  // cache entry so a failure at boot, when nothing is cached yet, is backed off
  // as well instead of re-probing a down RPC on every request.
  private latestBlockNextAttemptAt = 0;
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

    // Cold cache: share one in-flight read across concurrent callers, the same
    // way getTimelockDelay does. getProposalStatus runs per proposal, so a cold
    // listing would otherwise fire one identical eth_call per finished proposal
    // and trip upstream RPC rate limits.
    const inFlight = this.quorumFetches.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const fetch = fetcher()
      .then((quorum) => {
        this.quorumCache.set(cacheKey, {
          value: quorum,
          expiresAt: Date.now() + this.quorumCacheTtlMs,
        });
        return quorum;
      })
      .finally(() => {
        this.quorumFetches.delete(cacheKey);
      });

    this.quorumFetches.set(cacheKey, fetch);

    return fetch;
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
    const cached = this.cache.proposalThreshold;
    if (cached !== undefined) {
      return cached;
    }

    const proposalThreshold = (await this.readContract({
      abi: this.abi,
      address: this.address,
      functionName: "proposalThreshold",
      args: [],
    })) as bigint;
    this.cache.proposalThreshold = proposalThreshold;

    return proposalThreshold;
  }

  async getVotingDelay(): Promise<bigint> {
    const cached = this.cache.votingDelay;
    if (cached !== undefined) {
      return cached;
    }

    const votingDelay = (await this.readContract({
      abi: this.abi,
      address: this.address,
      functionName: "votingDelay",
      args: [],
    })) as bigint;
    this.cache.votingDelay = votingDelay;

    return votingDelay;
  }

  async getVotingPeriod(): Promise<bigint> {
    const cached = this.cache.votingPeriod;
    if (cached !== undefined) {
      return cached;
    }

    const votingPeriod = (await this.readContract({
      abi: this.abi,
      address: this.address,
      functionName: "votingPeriod",
      args: [],
    })) as bigint;
    this.cache.votingPeriod = votingPeriod;

    return votingPeriod;
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
    // Null when the RPC gave a block number but no timestamp. The block-based
    // statuses below are still computed; only the timestamp-based ones for
    // queued proposals are skipped.
    currentTimestamp: number | null,
  ): Promise<string> {
    // The timelock delay and grace period only matter for queued proposals, and
    // both can cost an eth_call. Reading them here instead of up front keeps a
    // proposal listing with nothing queued free of those RPC reads, so a
    // degraded RPC cannot downgrade every proposal to its indexed status.
    if (proposal.status === ProposalStatus.QUEUED && currentTimestamp) {
      let timelockDelay: bigint;
      let gracePeriod: bigint | null;
      try {
        [timelockDelay, gracePeriod] = await Promise.all([
          this.getTimelockDelay(),
          this.getGracePeriod(),
        ]);
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
        gracePeriod !== null &&
        BigInt(currentTimestamp) >=
          proposal.endTimestamp + timelockDelay + gracePeriod
      ) {
        return ProposalStatus.EXPIRED;
      }

      if (BigInt(currentTimestamp) >= proposal.endTimestamp + timelockDelay) {
        return ProposalStatus.PENDING_EXECUTION;
      }
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
   * Stale-while-revalidate with a staleness bound: only the very first call
   * waits for the RPC. Once warm, callers get the cached block immediately and
   * an expired entry kicks off a background refresh, so request latency does
   * not depend on RPC health and a short RPC blip degrades to a slightly stale
   * block. Past latestBlockMaxStaleMs the cached block is no longer served: the
   * call waits for a fresh RPC read and fails when that read fails, so callers
   * fall back to indexed statuses instead of computing them from a block that
   * is too old to be trusted.
   */
  private async getLatestBlock(): Promise<{
    number: number;
    timestamp: number | null;
  }> {
    const cached = this.latestBlockCache;
    const now = Date.now();
    // An in-flight read is joined rather than backed off: it costs no extra RPC
    // call and is the only way a concurrent caller gets a block at all.
    const backedOff =
      !this.latestBlockFetch && now < this.latestBlockNextAttemptAt;

    if (!cached) {
      // Nothing cached and the last read failed recently: fail fast instead of
      // probing a down RPC on every request.
      if (backedOff) {
        throw new Error(
          "Latest block is unavailable and the last RPC refresh failed",
        );
      }
      return this.refreshLatestBlock();
    }

    const age = now - cached.fetchedAt;
    if (age > this.latestBlockMaxStaleMs) {
      // Too old to serve. Inside the retry backoff of a failed refresh the RPC
      // is not probed again; the request fails fast instead.
      if (backedOff) {
        throw new Error(
          `Latest block is ${age}ms old and the last RPC refresh failed`,
        );
      }
      return this.refreshLatestBlock();
    }

    if (cached.expiresAt <= now && !backedOff) {
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
          // Recorded whether or not a block is cached, so an RPC that is down
          // at boot is backed off too.
          this.latestBlockNextAttemptAt = Date.now() + this.latestBlockRetryMs;
          const stale = this.latestBlockCache;
          logger.warn(
            { error, blockNumber: stale?.number },
            stale
              ? "Failed to refresh latest block; serving stale block"
              : "Failed to fetch latest block and none is cached",
          );
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

    const now = Date.now();
    this.latestBlockCache = {
      ...latestBlock,
      fetchedAt: now,
      expiresAt: now + this.latestBlockCacheTtlMs,
    };
    this.latestBlockNextAttemptAt = 0;

    return latestBlock;
  }
}
