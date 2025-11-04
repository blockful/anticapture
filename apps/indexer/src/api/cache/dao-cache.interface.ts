import { DaoResponse } from "../mappers";

/**
 * Interface for DAO data caching
 * Abstracts the cache implementation details from consumers
 */
export interface DaoDataCache {
  /**
   * Retrieves cached DAO data if valid, null if expired or not found
   */
  get(daoId: string): DaoResponse | null;

  /**
   * Stores DAO data in cache
   */
  set(daoId: string, data: DaoResponse): void;

  /**
   * Clears all cached data
   */
  clear(): void;
}
