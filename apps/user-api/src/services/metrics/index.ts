import { and, count, eq, inArray, isNull } from "drizzle-orm";

import type { AuthfulClient } from "@/clients/authful";
import { account, user, userApiKeys, walletAddress } from "@/database/schema";
import type { UserApiDrizzle } from "@/database/types";

export const AGE_BUCKETS = ["0-1d", "1-7d", "7-30d", "30d+"] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];
export const LOGIN_METHODS = ["wallet", "google", "email"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

export type LoginMethodMetrics = {
  tokens: number;
  usage: number;
};

export type MetricsSnapshot = {
  accountsTotal: number;
  keysLive: number;
  activeUsers: Record<AgeBucket, number>;
  loginMethods: Record<LoginMethod, LoginMethodMetrics>;
};

export type MetricsCounts = Pick<
  MetricsSnapshot,
  "accountsTotal" | "keysLive"
> & {
  liveTokens: Record<LoginMethod, number>;
};

type OwnedKey = {
  tokenId: string;
  userId: string;
  createdAt: Date;
  loginMethod: LoginMethod;
};

export interface MetricsDataSource {
  counts(): Promise<MetricsCounts>;
  keysForActiveTokenIds(tokenIds: string[]): Promise<OwnedKey[]>;
}

export class DatabaseMetricsDataSource implements MetricsDataSource {
  constructor(private readonly db: UserApiDrizzle) {}

  private async loginMethodsByUserId(
    userIds: string[],
  ): Promise<Map<string, LoginMethod>> {
    if (userIds.length === 0) return new Map();
    const [walletUsers, googleUsers] = await Promise.all([
      this.db
        .selectDistinct({ userId: walletAddress.userId })
        .from(walletAddress)
        .where(inArray(walletAddress.userId, userIds)),
      this.db
        .selectDistinct({ userId: account.userId })
        .from(account)
        .where(
          and(
            inArray(account.userId, userIds),
            eq(account.providerId, "google"),
          ),
        ),
    ]);
    const walletUserIds = new Set(walletUsers.map(({ userId }) => userId));
    const googleUserIds = new Set(googleUsers.map(({ userId }) => userId));
    return new Map(
      userIds.map((userId) => [
        userId,
        walletUserIds.has(userId)
          ? "wallet"
          : googleUserIds.has(userId)
            ? "google"
            : "email",
      ]),
    );
  }

  async counts(): Promise<MetricsCounts> {
    const [accounts, liveKeys] = await Promise.all([
      this.db.select({ value: count() }).from(user),
      this.db
        .select({
          userId: userApiKeys.userId,
        })
        .from(userApiKeys)
        .where(isNull(userApiKeys.revokedAt)),
    ]);
    const methods = await this.loginMethodsByUserId([
      ...new Set(liveKeys.map(({ userId }) => userId)),
    ]);
    const liveTokens = emptyLoginMethodValues();
    for (const { userId } of liveKeys) {
      liveTokens[methods.get(userId) ?? "email"] += 1;
    }
    return {
      accountsTotal: accounts[0]?.value ?? 0,
      keysLive: liveKeys.length,
      liveTokens,
    };
  }

  async keysForActiveTokenIds(tokenIds: string[]): Promise<OwnedKey[]> {
    if (tokenIds.length === 0) return [];
    const activeOwners = await this.db
      .selectDistinct({ userId: userApiKeys.userId })
      .from(userApiKeys)
      .where(inArray(userApiKeys.authfulTokenId, tokenIds));
    const userIds = activeOwners.map(({ userId }) => userId);
    if (userIds.length === 0) return [];
    const [keys, methods] = await Promise.all([
      this.db
        .select({
          tokenId: userApiKeys.authfulTokenId,
          userId: userApiKeys.userId,
          createdAt: userApiKeys.createdAt,
        })
        .from(userApiKeys)
        .where(inArray(userApiKeys.userId, userIds)),
      this.loginMethodsByUserId(userIds),
    ]);
    return keys.map((key) => ({
      ...key,
      loginMethod: methods.get(key.userId) ?? "email",
    }));
  }
}

const emptyActiveUsers = (): Record<AgeBucket, number> => ({
  "0-1d": 0,
  "1-7d": 0,
  "7-30d": 0,
  "30d+": 0,
});

const emptyLoginMethodValues = (): Record<LoginMethod, number> => ({
  wallet: 0,
  google: 0,
  email: 0,
});

const emptyLoginMethods = (): Record<LoginMethod, LoginMethodMetrics> => ({
  wallet: { tokens: 0, usage: 0 },
  google: { tokens: 0, usage: 0 },
  email: { tokens: 0, usage: 0 },
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
    activeUsers: emptyActiveUsers(),
    loginMethods: emptyLoginMethods(),
  };
  private refreshing = false;

  constructor(
    private readonly dataSource: MetricsDataSource,
    private readonly authful: Pick<AuthfulClient, "activeTokenUsage">,
    private readonly now: () => Date = () => new Date(),
  ) {}

  snapshot(): MetricsSnapshot {
    return this.current;
  }

  async refresh(): Promise<void> {
    // Serialize: a refresh slower than the 60s interval must not overlap with
    // the next tick, or a stale response could clobber a newer snapshot and a
    // stalled Authful could pile up in-flight fetches once a minute.
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      const now = this.now();
      // Publish DB-derived counts before touching Authful: if Authful is down
      // the account/key gauges must not stay stuck at their initial zeros.
      const counts = await this.dataSource.counts();
      const loginMethods = emptyLoginMethods();
      for (const method of LOGIN_METHODS) {
        loginMethods[method] = {
          tokens: counts.liveTokens[method],
          usage: this.current.loginMethods[method].usage,
        };
      }
      this.current = {
        ...this.current,
        accountsTotal: counts.accountsTotal,
        keysLive: counts.keysLive,
        loginMethods,
      };

      const usage = await this.authful.activeTokenUsage(saoPauloMidnight(now));
      const keys = await this.dataSource.keysForActiveTokenIds(
        usage.map(({ tokenId }) => tokenId),
      );
      const loginMethodByTokenId = new Map(
        keys.map(({ tokenId, loginMethod }) => [tokenId, loginMethod]),
      );
      const usageByLoginMethod = emptyLoginMethodValues();
      for (const item of usage) {
        const method = loginMethodByTokenId.get(item.tokenId);
        if (method) usageByLoginMethod[method] += item.count;
      }
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
      for (const method of LOGIN_METHODS) {
        loginMethods[method].usage = usageByLoginMethod[method];
      }
      this.current = { ...this.current, activeUsers, loginMethods };
    } finally {
      this.refreshing = false;
    }
  }
}
