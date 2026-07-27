import { and, eq, inArray, isNull } from "drizzle-orm";

import type { AuthfulClient } from "@/clients/authful";
import { account, user, userApiKeys, walletAddress } from "@/database/schema";
import type { UserApiDrizzle } from "@/database/types";

export const AGE_BUCKETS = ["0-1d", "1-7d", "7-30d", "30d+"] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];
export const LOGIN_METHODS = ["email", "google", "wallet"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

export type UserMetrics = {
  userId: string;
  identifier: string;
  loginMethod: LoginMethod;
  tokens: number;
  usage: number;
};

export type MetricsSnapshot = {
  accountsTotal: number;
  keysLive: number;
  activeUsers: Record<AgeBucket, number>;
  users: UserMetrics[];
};

export type MetricsCounts = Pick<
  MetricsSnapshot,
  "accountsTotal" | "keysLive"
> & {
  users: UserMetrics[];
};

type OwnedKey = {
  tokenId: string;
  userId: string;
  createdAt: Date;
};

export interface MetricsDataSource {
  counts(): Promise<MetricsCounts>;
  keysForActiveTokenIds(tokenIds: string[]): Promise<OwnedKey[]>;
}

export class DatabaseMetricsDataSource implements MetricsDataSource {
  constructor(private readonly db: UserApiDrizzle) {}

  private async identitiesByUserId(
    users: Array<{ id: string; email: string }>,
  ): Promise<Map<string, Pick<UserMetrics, "identifier" | "loginMethod">>> {
    const userIds = users.map(({ id }) => id);
    if (userIds.length === 0) return new Map();
    const [walletUsers, googleUsers] = await Promise.all([
      this.db
        .select({
          userId: walletAddress.userId,
          address: walletAddress.address,
          isPrimary: walletAddress.isPrimary,
        })
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
    const walletByUserId = new Map<
      string,
      { address: string; isPrimary: boolean }
    >();
    for (const wallet of walletUsers) {
      const candidate = {
        address: wallet.address,
        isPrimary: Boolean(wallet.isPrimary),
      };
      const current = walletByUserId.get(wallet.userId);
      if (
        !current ||
        (candidate.isPrimary && !current.isPrimary) ||
        (candidate.isPrimary === current.isPrimary &&
          candidate.address.localeCompare(current.address) < 0)
      ) {
        walletByUserId.set(wallet.userId, candidate);
      }
    }
    const googleUserIds = new Set(googleUsers.map(({ userId }) => userId));
    return new Map(
      users.map(({ id, email }) => {
        // Wallet users are deliberately separate accounts. Email and Google
        // may link; linked accounts are reported as Google, using their email
        // as the stable human-readable identifier.
        const wallet = walletByUserId.get(id);
        const identity = wallet
          ? { identifier: wallet.address, loginMethod: "wallet" as const }
          : googleUserIds.has(id)
            ? { identifier: email, loginMethod: "google" as const }
            : { identifier: email, loginMethod: "email" as const };
        return [id, identity];
      }),
    );
  }

  async counts(): Promise<MetricsCounts> {
    const [accounts, liveKeys] = await Promise.all([
      this.db.select({ id: user.id, email: user.email }).from(user),
      this.db
        .select({
          userId: userApiKeys.userId,
        })
        .from(userApiKeys)
        .where(isNull(userApiKeys.revokedAt)),
    ]);
    const identities = await this.identitiesByUserId(accounts);
    const tokensByUserId = new Map<string, number>();
    for (const { userId } of liveKeys) {
      tokensByUserId.set(userId, (tokensByUserId.get(userId) ?? 0) + 1);
    }
    const users = accounts
      .map(({ id }) => {
        const identity = identities.get(id);
        if (!identity) throw new Error(`missing metrics identity for ${id}`);
        return {
          userId: id,
          ...identity,
          tokens: tokensByUserId.get(id) ?? 0,
          usage: 0,
        };
      })
      .sort(
        (a, b) =>
          LOGIN_METHODS.indexOf(a.loginMethod) -
            LOGIN_METHODS.indexOf(b.loginMethod) ||
          a.identifier.localeCompare(b.identifier),
      );
    return {
      accountsTotal: accounts.length,
      keysLive: liveKeys.length,
      users,
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
    return this.db
      .select({
        tokenId: userApiKeys.authfulTokenId,
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
    activeUsers: emptyActiveUsers(),
    users: [],
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
      const previousUsageByUserId = new Map(
        this.current.users.map(({ userId, usage }) => [userId, usage]),
      );
      const users = counts.users.map((userMetrics) => ({
        ...userMetrics,
        usage: previousUsageByUserId.get(userMetrics.userId) ?? 0,
      }));
      this.current = {
        ...this.current,
        accountsTotal: counts.accountsTotal,
        keysLive: counts.keysLive,
        users,
      };

      const usage = await this.authful.activeTokenUsage(saoPauloMidnight(now));
      const keys = await this.dataSource.keysForActiveTokenIds(
        usage.map(({ tokenId }) => tokenId),
      );
      const userIdByTokenId = new Map(
        keys.map(({ tokenId, userId }) => [tokenId, userId]),
      );
      const usageByUserId = new Map<string, number>();
      for (const item of usage) {
        const userId = userIdByTokenId.get(item.tokenId);
        if (userId) {
          usageByUserId.set(
            userId,
            (usageByUserId.get(userId) ?? 0) + item.count,
          );
        }
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
      this.current = {
        ...this.current,
        activeUsers,
        users: users.map((userMetrics) => ({
          ...userMetrics,
          usage: usageByUserId.get(userMetrics.userId) ?? 0,
        })),
      };
    } finally {
      this.refreshing = false;
    }
  }
}
