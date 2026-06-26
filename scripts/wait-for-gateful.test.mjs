import assert from "node:assert/strict";
import test from "node:test";

import {
  isGatefulReady,
  resolveExpectedGatefulSha,
  resolveGatefulBaseUrl,
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
