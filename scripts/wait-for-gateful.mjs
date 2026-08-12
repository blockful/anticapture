#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 10 * 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10 * 1000;

const readNonEmptyValue = (value) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const trimTrailingSlashes = (url) => url.replace(/\/+$/, "");

export const resolveGatefulBaseUrl = (env = process.env) => {
  const gatefulUrl = readNonEmptyValue(env.ANTICAPTURE_API_URL);

  if (!gatefulUrl) {
    throw new Error("Unable to resolve Gateful URL. Set ANTICAPTURE_API_URL.");
  }

  const base = trimTrailingSlashes(gatefulUrl);

  return /^https?:\/\//i.test(base) ? base : `https://${base}`;
};

export const resolveExpectedGatefulSha = (env = process.env) =>
  readNonEmptyValue(env.EXPECTED_GATEFUL_SHA) ??
  readNonEmptyValue(env.VERCEL_GIT_COMMIT_SHA);

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readHealthBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export const fetchGatefulHealth = async (
  baseUrl,
  fetchImpl = globalThis.fetch,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
) => {
  if (!fetchImpl) {
    throw new Error("global fetch is unavailable; use Node.js 18 or newer.");
  }

  const response = await fetchImpl(`${baseUrl}/health`, {
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  return {
    status: response.status,
    body: await readHealthBody(response),
  };
};

// Upstreams not yet serving the release whose schemas we're about to read.
//
// Gateful builds /docs/json by merging its upstreams' specs live on every
// request — DAO APIs, the relayer and address enrichment all contribute paths
// and schemas (see mergeUpstreamDocs). So gateful reporting the new commit
// says nothing about the spec it will serve: those services rebuild only when
// a push touches their own watched paths, and take longer when it does.
//
// `staleShasByKind` maps an upstream kind to the commits that mean "still the
// previous release": everything strictly older than the last commit that
// touched that service's watched paths. Stated as a reject list rather than an
// accept list so that a commit newer than this run — from a push that
// superseded it while we were waiting — passes instead of blocking until the
// timeout. Anything else the service may legitimately report also passes:
// Railway stamps a service with the head of the push that rebuilt it, which is
// a later commit whenever a push carries more than one.
//
// An upstream reporting no commit is stale, not exempt — that is the previous
// release still answering, from before it reported one. That can't deadlock:
// teaching a service to report its commit necessarily touches its own watched
// paths, so the release that adds it is also the release that rebuilds it.
//
// A kind absent from the map (authful, whose spec is not merged) is not
// checked at all; it only has to be reachable.
export const staleUpstreams = (health, staleShasByKind = {}) =>
  Object.entries(health.body?.upstreams ?? {})
    .filter(([, upstream]) => {
      const stale = staleShasByKind[upstream?.kind];
      if (!stale?.length) {
        return false;
      }
      return !upstream.commit || stale.includes(upstream.commit);
    })
    .map(([name]) => name);

export const isGatefulReady = (
  health,
  expectedSha,
  staleShasByKind,
  staleGatefulShas = [],
) => {
  if (health.status !== 200) {
    return false;
  }

  if (!expectedSha) {
    return true;
  }

  const commit = health.body?.commit;

  // A gateful reporting no commit at all is the previous release still
  // answering: `railway up` from a laptop stamps no SHA, and the CI deploy
  // that would replace it is still in flight. Treat it as stale so we keep
  // waiting instead of handing codegen the old spec. If no such deploy is
  // coming, main() downgrades the timeout to a warning rather than failing.
  if (!commit) {
    return false;
  }

  // Same reasoning as staleUpstreams: with a reject list, a gateful newer than
  // this run counts as ready. Without one (PR previews), exact match only.
  const gatefulOk =
    commit === expectedSha ||
    (staleGatefulShas.length > 0 && !staleGatefulShas.includes(commit));

  if (!gatefulOk) {
    return false;
  }

  return staleUpstreams(health, staleShasByKind).length === 0;
};

export const waitForGateful = async ({
  baseUrl,
  expectedSha,
  staleShasByKind,
  staleGatefulShas,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  intervalMs = DEFAULT_INTERVAL_MS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
  now = Date.now,
  logger = console,
} = {}) => {
  const startedAt = now();
  const deadline = startedAt + timeoutMs;
  let attempt = 0;
  let lastHealth;
  let lastError;

  while (now() <= deadline) {
    attempt += 1;

    try {
      lastHealth = await fetchGatefulHealth(
        baseUrl,
        fetchImpl,
        requestTimeoutMs,
      );
      lastError = undefined;

      if (
        isGatefulReady(
          lastHealth,
          expectedSha,
          staleShasByKind,
          staleGatefulShas,
        )
      ) {
        logger.log(
          expectedSha
            ? `Gateful ready after attempt ${attempt}: commit ${
                lastHealth.body?.commit ?? "<missing>"
              }`
            : `Gateful ready after attempt ${attempt}`,
        );

        return { ready: true, attempt, lastHealth };
      }

      const stale = staleUpstreams(lastHealth, staleShasByKind);

      logger.log(
        `attempt ${attempt}: HTTP ${lastHealth.status}, commit ${
          lastHealth.body?.commit ?? "<missing>"
        }${
          stale.length > 0
            ? `, upstreams still on an older release: ${stale.join(", ")}`
            : ""
        }; waiting for ${expectedSha}`,
      );
    } catch (error) {
      lastError = error;
      logger.log(
        `attempt ${attempt}: ${
          error instanceof Error ? error.message : String(error)
        }; retrying`,
      );
    }

    await sleepImpl(intervalMs);
  }

  return { ready: false, attempt, lastHealth, lastError };
};

const main = async () => {
  const baseUrl = resolveGatefulBaseUrl();
  const expectedSha = resolveExpectedGatefulSha();
  const timeoutMs = parsePositiveInteger(
    process.env.GATEFUL_WAIT_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );
  const intervalMs = parsePositiveInteger(
    process.env.GATEFUL_WAIT_INTERVAL_MS,
    DEFAULT_INTERVAL_MS,
  );
  const requestTimeoutMs = parsePositiveInteger(
    process.env.GATEFUL_WAIT_REQUEST_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS,
  );

  // {kind: [sha, ...]} — the commits that mean an upstream kind is still on the
  // previous release (see staleUpstreams). Unset means "check nothing", which
  // is what PR previews do.
  const staleShasByKind = JSON.parse(
    readNonEmptyValue(process.env.STALE_UPSTREAM_SHAS) ?? "{}",
  );
  // Same, for gateful's own commit. Unset means exact match on expectedSha.
  const staleGatefulShas = (
    readNonEmptyValue(process.env.STALE_GATEFUL_SHAS) ?? ""
  )
    .split(",")
    .filter(Boolean);

  const result = await waitForGateful({
    baseUrl,
    expectedSha,
    staleShasByKind,
    staleGatefulShas,
    timeoutMs,
    intervalMs,
    requestTimeoutMs,
  });

  if (result.ready) {
    return;
  }

  // Timed out with a healthy gateful that never reported a commit: it was
  // deployed outside CI (`railway up`), so no push is coming to change that
  // and failing every release until someone redeploys from CI helps nobody.
  if (
    !result.lastError &&
    result.lastHealth?.status === 200 &&
    !result.lastHealth.body?.commit &&
    staleUpstreams(result.lastHealth, staleShasByKind).length === 0
  ) {
    console.warn(
      `::warning::Gateful reports no commit (deployed outside CI?) after ${timeoutMs}ms; proceeding without checking it against ${expectedSha}.`,
    );
    return;
  }

  if (process.env.GATEFUL_WAIT_SOFT === "1") {
    const reachability = await waitForGateful({
      baseUrl,
      timeoutMs: requestTimeoutMs,
      intervalMs: Math.min(intervalMs, 1000),
      requestTimeoutMs,
    });

    if (reachability.ready) {
      console.warn(
        `::warning::Gateful did not serve expected commit ${expectedSha ?? "<unset>"} before timeout, but /health is reachable.`,
      );
      return;
    }
  }

  const details = result.lastError
    ? result.lastError instanceof Error
      ? result.lastError.message
      : String(result.lastError)
    : `last health: HTTP ${result.lastHealth?.status ?? "<none>"}, commit ${
        result.lastHealth?.body?.commit ?? "<missing>"
      }${
        result.lastHealth
          ? `, upstreams still on an older release: ${
              staleUpstreams(result.lastHealth, staleShasByKind).join(", ") ||
              "<none>"
            }`
          : ""
      }`;

  throw new Error(
    `Gateful was not ready at ${baseUrl}/health after ${timeoutMs}ms; expected commit ${
      expectedSha ?? "<none>"
    }; ${details}`,
  );
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`::error::${error instanceof Error ? error.message : error}`);
    process.exit(1);
  });
}
