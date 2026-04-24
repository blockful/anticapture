import { getMesh } from "@graphql-mesh/runtime";
import { createMeshHTTPHandler } from "@graphql-mesh/http";
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { printSchema } from "graphql";
import { collectPrometheusMetrics } from "@anticapture/observability";

import "./_dev-reload";
import config from "../meshrc";
import { exporter } from "./instrumentation";
import { validateAuthToken } from "./auth";
import { httpRequestDuration } from "./metrics";

function resolveClientSource(header: string | undefined): string {
  if (header === "notification-system") return "notification-system";
  if (header === "anticapture-frontend") return "anticapture-frontend";
  return "other";
}

const bootstrap = async () => {
  const mesh = await getMesh(await config);

  writeFileSync("schema.graphql", printSchema(mesh.schema));

  const handler = createMeshHTTPHandler({
    baseDir: __dirname,
    getBuiltMesh: () => Promise.resolve(mesh),
  });

  const server = createServer(async (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (req.url === "/metrics") {
      try {
        const { body, contentType } = await collectPrometheusMetrics(exporter);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(body);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to collect metrics" }));
      }
      return;
    }
    if (!validateAuthToken(req, res)) return;

    const start = performance.now();
    const clientSource = resolveClientSource(
      req.headers["x-client-source"] as string | undefined,
    );

    res.on("finish", () => {
      const duration = (performance.now() - start) / 1000;
      const labels = {
        http_request_method: req.method ?? "UNKNOWN",
        http_route: req.url ?? "/",
        http_response_status_code: res.statusCode,
        client_source: clientSource,
      };
      httpRequestDuration.record(duration, labels);
    });

    handler(req, res);
  });

  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    console.log(`🚀 Mesh running at http://localhost:${port}/graphql`);
  });
};

bootstrap();
