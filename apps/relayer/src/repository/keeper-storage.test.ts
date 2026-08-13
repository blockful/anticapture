import { describe, it, expect, beforeEach } from "vitest";
import { getAddress, keccak256, toBytes } from "viem";

import type { TrackedProposal } from "@/services/keeper/proposal-lifecycle";

import { RedisKeeperStorage, type KeeperRedisClient } from "./keeper-storage";

const DAO = "ens";
const GOVERNOR = getAddress("0x323A76393544d5ecca80cd6ef2A560C6a395b7E3");

class FakeRedis implements KeeperRedisClient {
  strings = new Map<string, string>();
  hashes = new Map<string, Map<string, string>>();

  async get(key: string): Promise<string | null> {
    return this.strings.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<unknown> {
    this.strings.set(key, value);
    return "OK";
  }
  async hSet(key: string, field: string, value: string): Promise<number> {
    const hash = this.hashes.get(key) ?? new Map<string, string>();
    hash.set(field, value);
    this.hashes.set(key, hash);
    return 1;
  }
  async hGetAll(key: string): Promise<Record<string, string>> {
    return Object.fromEntries(this.hashes.get(key) ?? []);
  }
  async hDel(key: string, field: string): Promise<number> {
    return this.hashes.get(key)?.delete(field) ? 1 : 0;
  }
}

const PROPOSAL: TrackedProposal = {
  proposalId: "42",
  targets: [getAddress("0x2222222222222222222222222222222222222222")],
  values: ["1000000000000000000"],
  calldatas: ["0xdeadbeef"],
  descriptionHash: keccak256(toBytes("hello")),
  endBlock: "12345678",
};

let redis: FakeRedis;
let storage: RedisKeeperStorage;

beforeEach(() => {
  redis = new FakeRedis();
  storage = new RedisKeeperStorage(redis, DAO, GOVERNOR);
});

describe("cursor", () => {
  it("returns null when no cursor has been stored", async () => {
    expect(await storage.getCursor()).toBeNull();
  });

  it("round-trips the cursor as a bigint", async () => {
    await storage.setCursor(23456789n);
    expect(await storage.getCursor()).toBe(23456789n);
  });
});

describe("proposals", () => {
  it("lists nothing when empty", async () => {
    expect(await storage.listProposals()).toEqual([]);
  });

  it("round-trips a tracked proposal", async () => {
    await storage.putProposal(PROPOSAL);
    expect(await storage.listProposals()).toEqual([PROPOSAL]);
  });

  it("removes a proposal by id", async () => {
    await storage.putProposal(PROPOSAL);
    await storage.removeProposal("42");
    expect(await storage.listProposals()).toEqual([]);
  });

  it("scopes keys by dao and governor", async () => {
    await storage.putProposal(PROPOSAL);
    const other = new RedisKeeperStorage(redis, "uniswap", GOVERNOR);
    expect(await other.listProposals()).toEqual([]);
  });
});
