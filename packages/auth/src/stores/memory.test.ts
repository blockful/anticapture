import { describe, expect, it, vi } from "vitest";

import { memoryNonceStore } from "./memory.js";

describe("memoryNonceStore", () => {
  it("consumes a nonce exactly once", async () => {
    const store = memoryNonceStore();
    await store.issue("nonce-1");

    await expect(store.consume("nonce-1")).resolves.toBe(true);
    await expect(store.consume("nonce-1")).resolves.toBe(false);
  });

  it("rejects an unknown nonce", async () => {
    const store = memoryNonceStore();
    await expect(store.consume("never-issued")).resolves.toBe(false);
  });

  it("expires a nonce after its TTL", async () => {
    vi.useFakeTimers();
    try {
      const store = memoryNonceStore({ defaultTtlMs: 1000 });
      await store.issue("nonce-ttl");

      vi.advanceTimersByTime(1001);

      await expect(store.consume("nonce-ttl")).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("honors a per-nonce ttl override", async () => {
    vi.useFakeTimers();
    try {
      const store = memoryNonceStore({ defaultTtlMs: 1_000_000 });
      await store.issue("short-lived", 500);

      vi.advanceTimersByTime(501);

      await expect(store.consume("short-lived")).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws at capacity instead of evicting a live nonce", async () => {
    const store = memoryNonceStore({ maxEntries: 2 });

    await store.issue("first");
    await store.issue("second");

    // Must NOT silently drop "first" to make room (that would enable a
    // login-DoS via nonce flooding); it fails loud instead.
    await expect(store.issue("third")).rejects.toThrow(/capacity/i);

    // The existing live nonces are untouched.
    await expect(store.consume("first")).resolves.toBe(true);
    await expect(store.consume("second")).resolves.toBe(true);
  });

  it("reclaims expired entries to make room at capacity", async () => {
    vi.useFakeTimers();
    try {
      const store = memoryNonceStore({ maxEntries: 2, defaultTtlMs: 1000 });

      await store.issue("old-1");
      await store.issue("old-2");

      vi.advanceTimersByTime(1001); // both expire

      // issue sweeps expired first, so there is room again.
      await expect(store.issue("fresh")).resolves.toBeUndefined();
      await expect(store.consume("fresh")).resolves.toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("allows exactly one winner under concurrent consume calls", async () => {
    const store = memoryNonceStore();
    await store.issue("race-nonce");

    const results = await Promise.all(
      Array.from({ length: 20 }, () => store.consume("race-nonce")),
    );

    const trueCount = results.filter(Boolean).length;
    expect(trueCount).toBe(1);
  });
});
