import { Hono } from "hono/tiny";

import { registry } from "@/metrics";

const app = new Hono();

app.get("/metrics", async (c) => {
  return c.text(await registry.metrics(), 200, {
    "Content-Type": registry.contentType,
  });
});

export default app;
