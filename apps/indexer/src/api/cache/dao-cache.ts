export interface CachedDaoData {
  id: string;
  chainId: number;
  quorum: string;
  proposalThreshold: string;
  votingDelay: string;
  votingPeriod: string;
  timelockDelay: string;
  timestamp: number;
}

/**
 * In-memory cache for DAO governance parameters
 * Uses Dependency Injection pattern for easy testing and future Redis migration
 */
export class DaoCache {
  private cache = new Map<string, CachedDaoData>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Retrieves cached DAO data if valid, null if expired or not found
   */
  get(daoId: string): CachedDaoData | null {
    const cached = this.cache.get(daoId);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL_MS;
    if (isExpired) {
      this.cache.delete(daoId);
      return null;
    }

    return cached;
  }

  /**
   * Stores DAO data in cache with current timestamp
   */
  set(data: CachedDaoData): void {
    this.cache.set(data.id, { ...data, timestamp: Date.now() });
  }

  /**
   * Clears all cached data
   */
  clear(): void {
    this.cache.clear();
  }
}
