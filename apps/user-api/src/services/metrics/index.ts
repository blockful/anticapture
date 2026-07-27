import { count, inArray, isNull } from "drizzle-orm";

import type { AuthfulClient } from "@/clients/authful";
import { user, userApiKeys } from "@/database/schema";
import type { UserApiDrizzle } from "@/database/types";

export const AGE_BUCKETS = ["0-1d", "1-7d", "7-30d", "30d+"] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];

export type MetricsSnapshot = {
  accountsTotal: number;
  keysLive: number;
  keysCreatedTotal: number;
  activeUsers: Record<AgeBucket, number>;
};

type Counts = Omit<MetricsSnapshot, "activeUsers">;

type OwnedKey = {
  userId: string;
  createdAt: Date;
};

export interface MetricsDataSource {
  counts(): Promise<Counts>;
  newestKeysForActiveTokenIds(tokenIds: string[]): Promise<OwnedKey[]>;
}

export class DatabaseMetricsDataSource implements MetricsDataSource {
  constructor(private readonly db: UserApiDrizzle) {}

  async counts(): Promise<Counts> {
    const [accounts, liveKeys, createdKeys] = await Promise.all([
      this.db.select({ value: count() }).from(user),
      this.db
        .select({ value: count() })
        .from(userApiKeys)
        .where(isNull(userApiKeys.revokedAt)),
      this.db.select({ value: count() }).from(userApiKeys),
    ]);
    return {
      accountsTotal: accounts[0]?.value ?? 0,
      keysLive: liveKeys[0]?.value ?? 0,
      keysCreatedTotal: createdKeys[0]?.value ?? 0,
    };
  }

  async newestKeysForActiveTokenIds(tokenIds: string[]): Promise<OwnedKey[]> {
    if (tokenIds.length === 0) return [];
    const activeOwners = await this.db
      .selectDistinct({ userId: userApiKeys.userId })
      .from(userApiKeys)
      .where(inArray(userApiKeys.authfulTokenId, tokenIds));
    const userIds = activeOwners.map(({ userId }) => userId);
    if (userIds.length === 0) return [];
    return this.db
      .select({
        userId: userApiKeys.userId,
        createdAt: userApiKeys.createdAt,
      })
      .from(userApiKeys)
      .where(inArray(userApiKeys.userId, userIds));
  }
}

const emptyActiveUsers = (): Record<AgeBucket, number> => ({
  "0-1d": 0,
  "1-7d": 0,
  "7-30d": 0,
  "30d+": 0,
});

const saoPauloMidnight = (now: Date): Date => {
  // ponytail: fixed -03:00; switch to a tz library if Brazil reinstates DST
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1_000);
  return new Date(
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
      3,
    ),
  );
};

const ageBucket = (ageMs: number): AgeBucket => {
  const days = Math.max(0, ageMs) / (24 * 60 * 60 * 1_000);
  if (days < 1) return "0-1d";
  if (days < 7) return "1-7d";
  if (days < 30) return "7-30d";
  return "30d+";
};

export class MetricsSnapshotService {
  private current: MetricsSnapshot = {
    accountsTotal: 0,
    keysLive: 0,
    keysCreatedTotal: 0,
    activeUsers: emptyActiveUsers(),
  };

  constructor(
    private readonly dataSource: MetricsDataSource,
    private readonly authful: Pick<AuthfulClient, "activeTokenIds">,
    private readonly now: () => Date = () => new Date(),
  ) {}

  snapshot(): MetricsSnapshot {
    return this.current;
  }

  async refresh(): Promise<void> {
    const now = this.now();
    // Publish DB-derived counts before touching Authful: if Authful is down we
    // must not leave keysCreatedTotal at 0 and then have it jump to the
    // lifetime count on recovery (breaks the increase(...[1d]) dashboard query).
    const counts = await this.dataSource.counts();
    this.current = { ...this.current, ...counts };

    const tokenIds = await this.authful.activeTokenIds(saoPauloMidnight(now));
    const keys = await this.dataSource.newestKeysForActiveTokenIds(tokenIds);
    const newestKeyByUser = new Map<string, Date>();
    for (const key of keys) {
      const current = newestKeyByUser.get(key.userId);
      if (!current || key.createdAt > current) {
        newestKeyByUser.set(key.userId, key.createdAt);
      }
    }
    const activeUsers = emptyActiveUsers();
    for (const createdAt of newestKeyByUser.values()) {
      activeUsers[ageBucket(now.getTime() - createdAt.getTime())] += 1;
    }
    this.current = { ...this.current, activeUsers };
  }
}
