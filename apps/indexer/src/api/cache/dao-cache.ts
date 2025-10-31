import { DaoResponse } from "@/api/mappers";
import { DaoDataCache } from "./dao-cache.interface";

/**
 * Internal cache data structure with timestamp for TTL management
 */
interface CachedDaoData extends DaoResponse {
  timestamp: number;
}

/**
 * In-memory cache implementation for DAO governance parameters
 * Uses Dependency Injection pattern for easy testing and future Redis migration
 */
export class DaoCache implements DaoDataCache {
  private cache = new Map<string, CachedDaoData>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  get(daoId: string): DaoResponse | null {
    const cached = this.cache.get(daoId);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL_MS;
    if (isExpired) {
      this.cache.delete(daoId);
      return null;
    }

    // Remove internal timestamp before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp, ...daoResponse } = cached;
    return daoResponse;
  }

  set(daoId: string, data: DaoResponse): void {
    const cachedData: CachedDaoData = {
      ...data,
      timestamp: Date.now(),
    };
    this.cache.set(daoId, cachedData);
  }

  clear(): void {
    this.cache.clear();
  }
}
