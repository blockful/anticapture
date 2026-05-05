import { setupServer, type SetupServerApi } from "msw/node";
import { http, HttpResponse, type HttpHandler } from "msw";
import { handlers } from "../generated/mocks.js";

export * from "../generated/mocks.js";

// Re-export msw runtime + types so consumers building extra handlers go
// through the same module identity our .d.ts resolves to. MSW v2.8+ ships
// dual `.d.ts` files and TS treats them as nominally distinct via the
// `private __kind` brand on RequestHandler — funneling through this
// subpath defeats that.
export { http, HttpResponse };
export type { HttpHandler };

export const createTestServer = (
  ...extraHandlers: HttpHandler[]
): SetupServerApi => setupServer(...handlers, ...extraHandlers);
