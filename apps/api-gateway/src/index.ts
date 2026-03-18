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

import config from "../meshrc";
import { exporter } from "./instrumentation";
import { validateAuthToken } from "./auth";

let meshHandler: ReturnType<typeof createMeshHTTPHandler> | null = null;

const server = createServer(async (req, res) => {
  if (req.url === "/health") {
    const status = meshHandler ? "ok" : "starting";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status }));
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

  if (!meshHandler) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Service is starting" }));
    return;
  }

  if (!validateAuthToken(req, res)) return;
  meshHandler(req, res);
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`⏳ Server listening at http://localhost:${port}, loading mesh…`);
});

const bootstrap = async () => {
  const mesh = await getMesh(await config);

  writeFileSync("schema.graphql", printSchema(mesh.schema));

  meshHandler = createMeshHTTPHandler({
    baseDir: __dirname,
    getBuiltMesh: () => Promise.resolve(mesh),
  });

  console.log(`🚀 Mesh ready at http://localhost:${port}/graphql`);
};

bootstrap();
