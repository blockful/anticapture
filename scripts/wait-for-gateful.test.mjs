import assert from "node:assert/strict";
import test from "node:test";

import {
  isGatefulReady,
  resolveExpectedGatefulSha,
  resolveGatefulBaseUrl,
  staleUpstreams,
  waitForGateful,
} from "./wait-for-gateful.mjs";

const jsonResponse = (status, body) => ({
  status,
  json: async () => body,
});

test("resolveGatefulBaseUrl reads ANTICAPTURE_API_URL only", () => {
  assert.equal(
    resolveGatefulBaseUrl({
      ANTICAPTURE_API_URL: "https://preview.example.com/",
    }),
    "https://preview.example.com",
  );
  assert.equal(
    resolveGatefulBaseUrl({ ANTICAPTURE_API_URL: "gateful.internal" }),
    "https://gateful.internal",
  );
  assert.throws(() => resolveGatefulBaseUrl({}));
});

test("resolveExpectedGatefulSha prefers explicit expected SHA", () => {
  assert.equal(
    resolveExpectedGatefulSha({
      EXPECTED_GATEFUL_SHA: "head-sha",
      VERCEL_GIT_COMMIT_SHA: "vercel-sha",
    }),
    "head-sha",
  );
  assert.equal(
    resolveExpectedGatefulSha({ VERCEL_GIT_COMMIT_SHA: "vercel-sha" }),
    "vercel-sha",
  );
});

test("isGatefulReady requires the matching commit when expected", () => {
  assert.equal(isGatefulReady({ status: 200, body: {} }, undefined), true);
  assert.equal(
    isGatefulReady({ status: 200, body: { commit: "abc" } }, "abc"),
    true,
  );
  assert.equal(
    isGatefulReady({ status: 200, body: { commit: "old" } }, "abc"),
    false,
  );
  assert.equal(
    isGatefulReady({ status: 503, body: { commit: "abc" } }, "abc"),
    false,
  );
});

// The failure this guards: gateful on the new commit, ens-api 11s behind it,
// codegen reading the previous release's merged spec.
test("isGatefulReady waits for upstream commits only when required", () => {
  const health = {
    status: 200,
    body: {
      commit: "new",
      upstreams: {
        ens: { status: "ok", commit: "old" },
        uni: { status: "ok", commit: "new" },
      },
    },
  };

  assert.equal(isGatefulReady(health, "new", true), false);
  assert.equal(isGatefulReady(health, "new", false), true);
  assert.deepEqual(staleUpstreams(health, "new"), ["ens"]);
});

test("upstreams that report no commit never block the gate", () => {
  // Relayers, address enrichment and authful report none, and neither does a
  // DAO API deployed before the field existed. Blocking on them would stall
  // every release that doesn't rebuild them.
  const health = {
    status: 200,
    body: {
      commit: "new",
      upstreams: {
        "relayer:ens": { status: "ok" },
        authful: { status: "ok" },
        ens: { status: "ok", commit: "new" },
      },
    },
  };

  assert.equal(isGatefulReady(health, "new", true), true);
  assert.deepEqual(staleUpstreams(health, "new"), []);
});

test("waitForGateful polls until every upstream serves the commit", async () => {
  const responses = [
    jsonResponse(200, {
      commit: "new",
      upstreams: { ens: { status: "ok", commit: "old" } },
    }),
    jsonResponse(200, {
      commit: "new",
      upstreams: { ens: { status: "ok", commit: "new" } },
    }),
  ];
  let nowMs = 0;

  const result = await waitForGateful({
    baseUrl: "https://gateful.example.com",
    expectedSha: "new",
    requireUpstreamCommit: true,
    timeoutMs: 100,
    intervalMs: 10,
    fetchImpl: async () => responses.shift(),
    sleepImpl: async (ms) => {
      nowMs += ms;
    },
    now: () => nowMs,
    logger: { log: () => undefined },
  });

  assert.equal(result.ready, true);
  assert.equal(result.attempt, 2);
});

test("waitForGateful polls until the expected commit is live", async () => {
  const responses = [
    jsonResponse(200, { status: "ok", commit: "old" }),
    jsonResponse(200, { status: "ok", commit: "new" }),
  ];
  let nowMs = 0;

  const result = await waitForGateful({
    baseUrl: "https://gateful.example.com",
    expectedSha: "new",
    timeoutMs: 100,
    intervalMs: 10,
    fetchImpl: async () => responses.shift(),
    sleepImpl: async (ms) => {
      nowMs += ms;
    },
    now: () => nowMs,
    logger: { log: () => undefined },
  });

  assert.equal(result.ready, true);
  assert.equal(result.attempt, 2);
});

test("waitForGateful times out on stale commits", async () => {
  let nowMs = 0;

  const result = await waitForGateful({
    baseUrl: "https://gateful.example.com",
    expectedSha: "new",
    timeoutMs: 10,
    intervalMs: 10,
    fetchImpl: async () => jsonResponse(200, { status: "ok", commit: "old" }),
    sleepImpl: async (ms) => {
      nowMs += ms;
    },
    now: () => nowMs,
    logger: { log: () => undefined },
  });

  assert.equal(result.ready, false);
  assert.equal(result.attempt, 2);
});
