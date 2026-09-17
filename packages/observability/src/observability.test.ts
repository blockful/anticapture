import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import {
  collectPrometheusMetrics,
  createObservabilityProvider,
} from "./observability.js";

// The HTTP instrumentation patches `http` through require-in-the-middle, so
// the module has to be required (not statically imported) after the provider
// exists, exactly as a CJS service does with `import "./instrumentation"` first.
const require = createRequire(import.meta.url);

describe("createObservabilityProvider", () => {
  it("exports the HTTP auto-instrumentation metrics", async () => {
    const provider = createObservabilityProvider("observability-test");
    const http = require("http") as typeof import("node:http");

    const server = http.createServer((_req, res) => res.end("ok"));
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as { port: number };

    await new Promise<void>((resolve) =>
      http.get(`http://127.0.0.1:${port}/`, (res) => {
        res.resume();
        res.on("end", resolve);
      }),
    );

    const { body } = await collectPrometheusMetrics(provider.exporter);
    expect(body).toContain("# TYPE http_server_duration histogram");
    expect(body).toMatch(
      /http_server_duration_count\{[^}]*http_status_code="200"/,
    );

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await provider.shutdown();
  });
});
