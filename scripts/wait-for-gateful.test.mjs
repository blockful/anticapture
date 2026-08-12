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
test("isGatefulReady checks a kind only when shas are given for it", () => {
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

  assert.equal(isGatefulReady(health, "new", { "dao-api": ["old"] }), false);
  assert.equal(isGatefulReady(health, "new", {}), true);
  assert.deepEqual(staleUpstreams(health, { "dao-api": ["old"] }), ["ens"]);
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

  assert.equal(isGatefulReady(health, "new", { "dao-api": ["old"] }), false);
  assert.deepEqual(staleUpstreams(health, { "dao-api": ["old"] }), ["ens"]);
});

test("a release that doesn't rebuild the DAO APIs passes on their older commit", () => {
  // The APIs sit on the last commit that touched them, which is not in the
  // stale set — demanding HEAD would wait for a rebuild that is never going
  // to happen.
  const health = {
    status: 200,
    body: {
      commit: "head",
      upstreams: { ens: { kind: "dao-api", status: "ok", commit: "api-push" } },
    },
  };

  assert.equal(
    isGatefulReady(health, "head", { "dao-api": ["before-api-push"] }),
    true,
  );
});

test("a non-API push superseding an in-flight API push still waits", () => {
  // Push A touches the API, push B doesn't and cancels A's waiter. B resolves
  // the same stale set (everything before A), so the gate keeps waiting while
  // the APIs finish deploying A instead of reading their pre-A spec.
  const deploying = {
    status: 200,
    body: {
      commit: "B",
      upstreams: { ens: { kind: "dao-api", status: "ok", commit: "pre-A" } },
    },
  };
  const settled = {
    status: 200,
    body: {
      commit: "B",
      upstreams: { ens: { kind: "dao-api", status: "ok", commit: "A" } },
    },
  };

  assert.equal(isGatefulReady(deploying, "B", { "dao-api": ["pre-A"] }), false);
  assert.equal(isGatefulReady(settled, "B", { "dao-api": ["pre-A"] }), true);
});

test("every spec-contributing upstream is gated, on its own commit", () => {
  // The relayer and address enrichment also merge paths and schemas into
  // /docs/json, and each rebuilds on its own watch paths — so each is checked
  // against its own release, not the DAO APIs'. Authful contributes no spec
  // and is absent from the map, so it only has to be reachable.
  const expected = {
    "dao-api": ["before-api-push"],
    relayer: ["before-relayer-push"],
    "address-enrichment": ["before-enrichment-push"],
  };
  const health = {
    status: 200,
    body: {
      commit: "head",
      upstreams: {
        ens: { kind: "dao-api", status: "ok", commit: "api-push" },
        "relayer:ens": { kind: "relayer", status: "ok", commit: "head" },
        "address-enrichment": {
          kind: "address-enrichment",
          status: "ok",
          commit: "enrichment-push",
        },
        authful: { kind: "token-service", status: "ok" },
      },
    },
  };

  assert.deepEqual(staleUpstreams(health, expected), []);
  assert.equal(isGatefulReady(health, "head", expected), true);

  const behind = structuredClone(health);
  behind.body.upstreams["relayer:ens"].commit = "before-relayer-push";
  assert.deepEqual(staleUpstreams(behind, expected), ["relayer:ens"]);
  assert.equal(isGatefulReady(behind, "head", expected), false);
});

test("waitForGateful polls until every DAO API serves the commit", async () => {
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
    staleShasByKind: { "dao-api": ["old"] },
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

test("a deployment newer than this run is ready, not stale", () => {
  // The queued-release case: a push lands on main while we wait, Railway
  // redeploys gateful and the APIs to a commit this run has never seen. Its
  // spec is at least as new as ours, so waiting it out would be a 10-minute
  // timeout for nothing.
  const health = {
    status: 200,
    body: {
      commit: "newer-than-head",
      upstreams: {
        ens: { kind: "dao-api", status: "ok", commit: "newer-than-head" },
      },
    },
  };

  assert.equal(
    isGatefulReady(health, "head", { "dao-api": ["pre-head"] }, ["pre-head"]),
    true,
  );
  // Without a reject list (PR previews) gateful's commit stays exact.
  assert.equal(isGatefulReady(health, "head", {}), false);
});

test("a gateful with no commit is ready, not waited out", () => {
  // `railway up` from a laptop stamps no SHA. Nothing will ever make that
  // deployment report one, so demanding a match is a guaranteed timeout.
  const health = { status: 200, body: { commit: null } };

  assert.equal(isGatefulReady(health, "head", {}, ["pre-head"]), true);
  assert.equal(isGatefulReady(health, "head", {}), true);

  // Its upstreams are still checked: they deploy independently of gateful.
  const behind = {
    status: 200,
    body: {
      commit: null,
      upstreams: { ens: { kind: "dao-api", status: "ok", commit: "pre-head" } },
    },
  };
  assert.equal(
    isGatefulReady(behind, "head", { "dao-api": ["pre-head"] }),
    false,
  );
});
