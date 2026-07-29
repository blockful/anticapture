import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as schema from "@/database/schema";
import { account, user, userApiKeys, walletAddress } from "@/database/schema";
import { DatabaseMetricsDataSource } from "@/services/metrics";

const WALLET_TOKEN = "00000000-0000-4000-8000-000000000001";
const GOOGLE_TOKEN = "00000000-0000-4000-8000-000000000002";
const EMAIL_TOKEN = "00000000-0000-4000-8000-000000000003";
const REVOKED_TOKEN = "00000000-0000-4000-8000-000000000004";
const CREATED_AT = new Date("2026-07-27T12:00:00.000Z");

describe("database validation metrics", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  const dataSource = new DatabaseMetricsDataSource(db);

  beforeAll(async () => {
    await client.exec(`
      create table "user" (
        id text primary key,
        name text not null,
        email text not null unique,
        email_verified boolean not null default false,
        image text,
        created_at timestamp not null default now(),
        updated_at timestamp not null default now()
      );
      create table account (
        id text primary key,
        account_id text not null,
        provider_id text not null,
        user_id text not null,
        access_token text,
        refresh_token text,
        id_token text,
        access_token_expires_at timestamp,
        refresh_token_expires_at timestamp,
        scope text,
        password text,
        created_at timestamp not null default now(),
        updated_at timestamp not null default now()
      );
      create table wallet_address (
        id text primary key,
        user_id text not null,
        address text not null,
        chain_id integer not null,
        is_primary boolean default false,
        created_at timestamp not null
      );
      create table user_api_keys (
        id uuid primary key,
        user_id text not null,
        authful_token_id uuid not null,
        label text not null,
        created_at timestamptz not null default now(),
        revoked_at timestamptz
      );
    `);

    await db.insert(user).values([
      { id: "wallet-user", name: "Wallet", email: "wallet@example.com" },
      { id: "google-user", name: "Google", email: "google@example.com" },
      { id: "email-user", name: "Email", email: "email@example.com" },
      {
        id: "no-token-user",
        name: "No token",
        email: "no-token@example.com",
      },
    ]);
    await db.insert(account).values({
      id: "google",
      accountId: "google",
      providerId: "google",
      userId: "google-user",
    });
    await db.insert(walletAddress).values({
      id: "wallet",
      userId: "wallet-user",
      address: "0x0000000000000000000000000000000000000001",
      chainId: 1,
      createdAt: CREATED_AT,
    });
    await db.insert(userApiKeys).values([
      {
        id: crypto.randomUUID(),
        userId: "wallet-user",
        authfulTokenId: WALLET_TOKEN,
        label: "wallet",
        createdAt: CREATED_AT,
      },
      {
        id: crypto.randomUUID(),
        userId: "google-user",
        authfulTokenId: GOOGLE_TOKEN,
        label: "google",
        createdAt: CREATED_AT,
      },
      {
        id: crypto.randomUUID(),
        userId: "email-user",
        authfulTokenId: EMAIL_TOKEN,
        label: "email",
        createdAt: CREATED_AT,
      },
      {
        id: crypto.randomUUID(),
        userId: "email-user",
        authfulTokenId: REVOKED_TOKEN,
        label: "revoked",
        createdAt: CREATED_AT,
        revokedAt: new Date("2026-07-27T13:00:00.000Z"),
      },
    ]);
  });

  afterAll(async () => {
    await client.close();
  });

  it("lists every user by email, Google email, then wallet identifier", async () => {
    const result = await dataSource.counts();

    expect(result).toEqual({
      accountsTotal: 4,
      keysLive: 3,
      users: [
        {
          userId: "email-user",
          identifier: "email@example.com",
          loginMethod: "email",
          tokens: 1,
          usage: 0,
        },
        {
          userId: "no-token-user",
          identifier: "no-token@example.com",
          loginMethod: "email",
          tokens: 0,
          usage: 0,
        },
        {
          userId: "google-user",
          identifier: "google@example.com",
          loginMethod: "google",
          tokens: 1,
          usage: 0,
        },
        {
          userId: "wallet-user",
          identifier: "0x0000000000000000000000000000000000000001",
          loginMethod: "wallet",
          tokens: 1,
          usage: 0,
        },
      ],
    });
  });

  it("returns all keys owned by active users", async () => {
    const result = await dataSource.keysForActiveTokenIds([
      WALLET_TOKEN,
      GOOGLE_TOKEN,
      EMAIL_TOKEN,
    ]);
    result.sort((a, b) => a.tokenId.localeCompare(b.tokenId));

    expect(result).toEqual([
      {
        tokenId: WALLET_TOKEN,
        userId: "wallet-user",
        createdAt: CREATED_AT,
      },
      {
        tokenId: GOOGLE_TOKEN,
        userId: "google-user",
        createdAt: CREATED_AT,
      },
      {
        tokenId: EMAIL_TOKEN,
        userId: "email-user",
        createdAt: CREATED_AT,
      },
      {
        tokenId: REVOKED_TOKEN,
        userId: "email-user",
        createdAt: CREATED_AT,
      },
    ]);
  });
});
