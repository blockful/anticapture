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
        ens: { kind: "dao-api", status: "ok", commit: "old" },
        uni: { kind: "dao-api", status: "ok", commit: "new" },
      },
    },
  };

  assert.equal(isGatefulReady(health, "new", true), false);
  assert.equal(isGatefulReady(health, "new", false), true);
  assert.deepEqual(staleUpstreams(health, "new"), ["ens"]);
});

test("a DAO API reporting no commit is stale, not exempt", () => {
  // The rollout case: the field ships in the same release, so the still-old
  // API omits it. Reading that as "nothing to wait for" would reproduce the
  // race this gate exists to prevent.
  const health = {
    status: 200,
    body: {
      commit: "new",
      upstreams: { ens: { kind: "dao-api", status: "ok" } },
    },
  };

  assert.equal(isGatefulReady(health, "new", true), false);
  assert.deepEqual(staleUpstreams(health, "new"), ["ens"]);
});

test("upstreams that aren't DAO APIs never block the gate", () => {
  // Relayers, address enrichment and authful report no commit and only have
  // to be reachable — waiting on them would stall releases that never
  // rebuild them.
  const health = {
    status: 200,
    body: {
      commit: "new",
      upstreams: {
        "relayer:ens": { kind: "relayer", status: "ok" },
        authful: { kind: "token-service", status: "ok" },
        ens: { kind: "dao-api", status: "ok", commit: "new" },
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
      upstreams: { ens: { kind: "dao-api", status: "ok", commit: "old" } },
    }),
    jsonResponse(200, {
      commit: "new",
      upstreams: { ens: { kind: "dao-api", status: "ok", commit: "new" } },
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
