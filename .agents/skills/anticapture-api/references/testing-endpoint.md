# Testing Endpoints

Use integration-style controller tests that mount the route in a real Hono app and hit it with `app.request(...)`.

## Commands

- Run all API tests:
  - `pnpm run --filter=@anticapture/api test`
- Run API typecheck:
  - `pnpm run --filter=@anticapture/api typecheck`

## Minimal Pattern

Use existing controller tests as reference (for example, `apps/api/src/controllers/delegations/delegators.test.ts`).

```typescript
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { describe, it, expect } from "vitest";
import { endpoint } from "./endpoint";

function createTestApp(service: Service) {
  const app = new Hono();
  endpoint(app, service);
  return app;
}

describe("Endpoint", () => {
  it("returns 200 on valid input", async () => {
    const service = new Service(fakeRepository);
    const app = createTestApp(service);
    const response = await app.request("/your/route");
    expect(response.status).toBe(200);
  });
});
```

## Coverage Expectations

- Happy path status and response shape.
- Invalid params/query/body returns `400`.
- Edge-case pagination/sorting/defaults (when relevant).
- Serialization checks for `bigint`/address normalization (when relevant).
