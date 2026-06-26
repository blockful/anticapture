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

export const isGatefulReady = (health, expectedSha) => {
  if (health.status !== 200) {
    return false;
  }

  if (!expectedSha) {
    return true;
  }

  return health.body?.commit === expectedSha;
};

export const waitForGateful = async ({
  baseUrl,
  expectedSha,
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

      if (isGatefulReady(lastHealth, expectedSha)) {
        logger.log(
          expectedSha
            ? `Gateful ready after attempt ${attempt}: commit ${expectedSha}`
            : `Gateful ready after attempt ${attempt}`,
        );

        return { ready: true, attempt, lastHealth };
      }

      logger.log(
        `attempt ${attempt}: HTTP ${lastHealth.status}, commit ${
          lastHealth.body?.commit ?? "<missing>"
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

  const result = await waitForGateful({
    baseUrl,
    expectedSha,
    timeoutMs,
    intervalMs,
    requestTimeoutMs,
  });

  if (result.ready) {
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
