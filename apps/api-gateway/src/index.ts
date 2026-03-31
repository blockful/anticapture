import { getMesh } from "@graphql-mesh/runtime";
import { createMeshHTTPHandler } from "@graphql-mesh/http";
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { printSchema } from "graphql";
import {
  PROMETHEUS_MIME_TYPE,
  PrometheusSerializer,
} from "@anticapture/observability";

const prometheusSerializer = new PrometheusSerializer();

import "./_dev-reload";
import config from "../meshrc";
import { exporter } from "./instrumentation";
import { validateAuthToken } from "./auth";

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
        const result = await exporter.collect();
        const serialized = prometheusSerializer.serialize(
          result.resourceMetrics,
        );
        res.writeHead(200, { "Content-Type": PROMETHEUS_MIME_TYPE });
        res.end(serialized);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to collect metrics" }));
      }
      return;
    }
    if (!validateAuthToken(req, res)) return;
    handler(req, res);
  });

  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    console.log(`🚀 Mesh running at http://localhost:${port}/graphql`);
  });
};

bootstrap();
