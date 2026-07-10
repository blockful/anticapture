/* eslint-disable @typescript-eslint/no-explicit-any */
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import * as fullSchema from "@/database/schema";
import {
  account,
  drafts,
  session,
  user,
  verification,
  walletAddress,
} from "@/database/schema";
import { DraftsRepository } from "@/repositories/drafts";
import { DraftsService } from "@/services/drafts";
import { migrateDrafts, type SourceDraft } from "./migrate-drafts";

const ADDR = "0xAbC0000000000000000000000000000000000001";

const source = (over: Partial<SourceDraft> = {}): SourceDraft => ({
  id: crypto.randomUUID(),
  daoId: "ens",
  author: ADDR,
  title: "migrated",
  discussionUrl: "",
  body: "body",
  actions: [],
  createdAt: 1700000000000,
  updatedAt: 1700000000001,
  ...over,
});

describe("migrateDrafts", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema: fullSchema });

  beforeEach(async () => {
    const tables = {
      user,
      session,
      account,
      verification,
      walletAddress,
      drafts,
    };
    const { apply } = await pushSchema(tables as any, db as any);
    await apply();
    await db.delete(drafts);
  });

  afterAll(async () => {
    await client.close();
  });

  it("copies rows unclaimed, preserving id/timestamps and lowercasing author", async () => {
    const row = source();
    const report = await migrateDrafts([row], db);

    expect(report).toEqual({ read: 1, inserted: 1, skipped: 0, invalid: 0 });
    const [stored] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.id, row.id));
    expect(stored).toMatchObject({
      id: row.id,
      userId: null,
      authorAddress: ADDR.toLowerCase(),
      daoId: "ens",
      createdAt: 1700000000000,
      updatedAt: 1700000000001,
    });
  });

  it("is idempotent — a second run skips existing ids", async () => {
    const rows = [source(), source()];
    await migrateDrafts(rows, db);
    const second = await migrateDrafts(rows, db);

    expect(second).toEqual({ read: 2, inserted: 0, skipped: 2, invalid: 0 });
    expect(await db.$count(drafts)).toBe(2);
  });

  it("skips malformed rows without aborting the batch", async () => {
    const rows = [
      source(),
      source({ id: "not-a-uuid" }),
      source({ author: "0xnothex" }),
      source({ daoId: "" }),
    ];
    const report = await migrateDrafts(rows, db);

    expect(report).toEqual({ read: 4, inserted: 1, skipped: 0, invalid: 3 });
    expect(await db.$count(drafts)).toBe(1);
  });

  it("dry-run writes nothing", async () => {
    const report = await migrateDrafts([source(), source()], db, {
      dryRun: true,
    });
    expect(report.inserted).toBe(0);
    expect(await db.$count(drafts)).toBe(0);
  });

  it("migrated rows are claimed on the author's first login", async () => {
    const row = source();
    await migrateDrafts([row], db);

    // Simulate that wallet having signed in: a user + linked walletAddress.
    const [u] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "u",
        email: `${ADDR.toLowerCase()}@wallet.local`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    await db.insert(walletAddress).values({
      id: crypto.randomUUID(),
      userId: u!.id,
      address: ADDR.toLowerCase(),
      chainId: 1,
      isPrimary: true,
      createdAt: new Date(),
    });

    const service = new DraftsService(new DraftsRepository(db));
    const list = await service.listForUser(u!.id, "ens");

    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe(row.id);
    expect(list[0]!.userId).toBe(u!.id);
  });
});
