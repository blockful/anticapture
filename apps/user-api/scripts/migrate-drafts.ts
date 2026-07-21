/**
 * One-shot migration: copies draft proposals from a DAO API's Postgres
 * (`general.proposal_drafts`) into the User API's `drafts` table.
 *
 * Run once per DAO source database (each DAO API has its own):
 *
 *   SOURCE_DATABASE_URL=postgres://…dao-db  DATABASE_URL=postgres://…user-db \
 *     pnpm --filter @anticapture/user-api migrate:drafts [--dry-run]
 *
 * Migrated rows land unclaimed (`user_id NULL`) with the original author
 * wallet in `author_address`; the User API claims them onto a user on that
 * wallet's first SIWE login (ProposalDraftsService.listForUser). Draft ids are
 * preserved verbatim so existing share links keep resolving. Idempotent:
 * re-running skips ids already present (also how cross-DAO id collisions are
 * handled — first writer wins, the rest are logged as skipped).
 */
import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { isAddress } from "viem";

import * as schema from "@/database/schema";
import { drafts } from "@/database/schema";
import type { UserApiDrizzle } from "@/database/types";

export type SourceDraft = {
  id: string;
  daoId: string;
  author: string;
  title: string;
  discussionUrl: string;
  body: string;
  actions: unknown[];
  createdAt: number;
  updatedAt: number;
};

export type MigrationReport = {
  read: number;
  inserted: number;
  skipped: number;
  invalid: number;
};

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Imported rows are untrusted DB content — reject anything malformed. */
const isValid = (row: SourceDraft): boolean =>
  isUuid(row.id) &&
  row.daoId.length > 0 &&
  // Non-strict: legacy rows may carry any casing; they're lowercased on write.
  isAddress(row.author, { strict: false }) &&
  Number.isFinite(row.createdAt) &&
  Number.isFinite(row.updatedAt);

/**
 * Pure core: inserts the given source rows into the User API `drafts` table,
 * skipping invalid rows and ids that already exist. Separated from the CLI so
 * it can be exercised against an in-memory DB in tests.
 */
export async function migrateDrafts(
  rows: SourceDraft[],
  db: UserApiDrizzle,
  opts: { dryRun?: boolean } = {},
): Promise<MigrationReport> {
  const report: MigrationReport = {
    read: rows.length,
    inserted: 0,
    skipped: 0,
    invalid: 0,
  };

  for (const row of rows) {
    if (!isValid(row)) {
      report.invalid++;
      continue;
    }
    if (opts.dryRun) continue;

    const inserted = await db
      .insert(drafts)
      .values({
        id: row.id,
        userId: null,
        authorAddress: row.author.toLowerCase(),
        daoId: row.daoId,
        title: row.title,
        discussionUrl: row.discussionUrl,
        body: row.body,
        actions: row.actions,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length > 0) report.inserted++;
    else report.skipped++;
  }

  return report;
}

/** Reads `general.proposal_drafts` from a DAO source database. */
async function readSource(sourceUrl: string): Promise<SourceDraft[]> {
  const pool = new Pool({ connectionString: sourceUrl });
  try {
    const { rows } = await pool.query(
      `SELECT id, dao_id, author, title, discussion_url, body, actions,
              created_at, updated_at
       FROM general.proposal_drafts`,
    );
    return rows.map((r) => ({
      id: r.id,
      daoId: r.dao_id,
      author: r.author,
      title: r.title,
      discussionUrl: r.discussion_url,
      body: r.body,
      actions: (r.actions ?? []) as unknown[],
      // bigint columns arrive as strings via node-postgres.
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    }));
  } finally {
    await pool.end();
  }
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const destUrl = process.env.DATABASE_URL;
  const dryRun = process.argv.includes("--dry-run");

  if (!sourceUrl || !destUrl) {
    console.error(
      "SOURCE_DATABASE_URL (DAO db) and DATABASE_URL (user-api db) are required",
    );
    process.exit(1);
  }

  const rows = await readSource(sourceUrl);
  const db = drizzle(destUrl, { schema });

  // Fail loud if the destination table is missing (wrong DATABASE_URL).
  await db.execute(sql`select 1 from drafts limit 1`).catch((err) => {
    console.error(
      "destination `drafts` table not reachable — check DATABASE_URL",
    );
    throw err;
  });

  const report = await migrateDrafts(rows, db, { dryRun });
  console.error(
    `${dryRun ? "[dry-run] " : ""}drafts migration: ` +
      `read=${report.read} inserted=${report.inserted} ` +
      `skipped=${report.skipped} invalid=${report.invalid}`,
  );
  process.exit(0);
}

// Run only when invoked directly, not when imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main();
}
