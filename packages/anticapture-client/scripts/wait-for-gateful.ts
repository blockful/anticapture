import { resolveGatefulOpenApiSpecUrl } from "../src/gateful-openapi-spec";

const DEFAULT_ATTEMPTS = 60;
const DEFAULT_INTERVAL_MS = 10_000;

const readPositiveInteger = (name: string, defaultValue: number) => {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `${name} must be a positive integer. Received: ${rawValue}`,
    );
  }

  return value;
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const waitForGateful = async () => {
  const specUrl = resolveGatefulOpenApiSpecUrl();
  const attempts = readPositiveInteger(
    "GATEFUL_WAIT_ATTEMPTS",
    DEFAULT_ATTEMPTS,
  );
  const intervalMs = readPositiveInteger(
    "GATEFUL_WAIT_INTERVAL_MS",
    DEFAULT_INTERVAL_MS,
  );

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(specUrl);

      if (response.ok) {
        console.log(
          `[wait-for-gateful] ${specUrl} returned HTTP ${response.status} on attempt ${attempt}/${attempts}`,
        );

        return;
      }

      console.log(
        `[wait-for-gateful] attempt ${attempt}/${attempts}: HTTP ${response.status} ${response.statusText}`,
      );
    } catch (error) {
      console.log(
        `[wait-for-gateful] attempt ${attempt}/${attempts}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (attempt < attempts) {
      await sleep(intervalMs);
    }
  }

  throw new Error(
    `Gateful OpenAPI spec was not ready at ${specUrl} after ${attempts} attempt(s).`,
  );
};

await waitForGateful();
