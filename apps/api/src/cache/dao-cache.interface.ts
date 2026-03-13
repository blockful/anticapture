import { DaoParametersRPCResponse } from "../mappers";

/**
 * Interface for DAO data caching
 * Abstracts the cache implementation details from consumers
 */
export interface DaoDataCache {
  /**
   * Retrieves cached DAO data if valid, null if expired or not found
   */
  get(daoId: string): DaoParametersRPCResponse | null;

  /**
   * Stores DAO data in cache
   */
  set(daoId: string, data: DaoParametersRPCResponse): void;

  /**
   * Clears all cached data
   */
  clear(): void;
}
