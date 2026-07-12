import type { NextRequest } from "next/server";

// Same-origin proxy to the User API (identity + drafts). Unlike the gateful
// proxy, this one is cookie-based: it relays the browser's Cookie upstream and
// the User API's Set-Cookie back, so better-auth's HTTP-only session works
// first-party. It forwards the real browser host as x-forwarded-host so the
// User API resolves the correct per-host SIWE better-auth instance and so
// better-auth reconstructs the browser-visible URL for CSRF/cookie scoping.

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

// Only the browser-facing surface is proxied. The User API also serves
// internal endpoints (/health, /metrics) that must not become publicly
// reachable through the dashboard origin.
const isAllowedPath = (path: string[]) => {
  const joined = path.join("/");
  return (
    joined.startsWith("api/auth/") || // better-auth (sessions, sign-in/out)
    joined === "auth/methods" || // sign-in capability discovery
    joined === "drafts" ||
    joined.startsWith("drafts/") ||
    joined.startsWith("me/") // per-user resources (API keys)
  );
};

const buildUpstreamUrl = (request: NextRequest, path: string[]) => {
  const pathname = path.map(encodeURIComponent).join("/");
  const base = process.env.USER_API_URL;
  if (!base) throw new Error("USER_API_URL is not configured");

  const upstreamUrl = new URL(pathname ? `./${pathname}` : "./", `${base}/`);
  upstreamUrl.search = new URL(request.url).search;
  return upstreamUrl;
};

const getForwardHeaders = (request: NextRequest) => {
  const headers = new Headers();

  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // better-auth validates the request Origin against trustedOrigins.
  const origin = request.headers.get("origin");
  if (origin) headers.set("origin", origin);

  // The real browser-facing host — the upstream fetch would otherwise set Host
  // to the internal service host, which is never in AUTH_SIWE_DOMAINS. Sent as
  // a custom header (not just x-forwarded-host) because Railway's edge proxy in
  // front of the User API overwrites the x-forwarded-* set; a custom x- header
  // passes through untouched. x-forwarded-host is kept for edge-less setups
  // (local dev). See forwardedHost() in @anticapture/user-api.
  const host = request.headers.get("host");
  if (host) {
    headers.set("x-anticapture-host", host);
    headers.set("x-forwarded-host", host);
  }
  headers.set(
    "x-forwarded-proto",
    request.nextUrl.protocol.replace(":", "") || "https",
  );

  return headers;
};

const proxyRequest = async (
  request: NextRequest,
  { params }: RouteContext,
  method: string,
) => {
  const { path = [] } = await params;
  if (!isAllowedPath(path)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const upstreamResponse = await fetch(buildUpstreamUrl(request, path), {
    method,
    headers: getForwardHeaders(request),
    body:
      method === "GET" || method === "HEAD" ? undefined : await request.text(),
    redirect: "manual",
  });

  // Rebuild response headers so every Set-Cookie survives (a plain header copy
  // collapses duplicates); drop hop-by-hop encoding headers fetch already
  // decoded.
  const headers = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (key === "set-cookie" || key === "content-encoding") return;
    headers.set(key, value);
  });
  for (const cookie of upstreamResponse.headers.getSetCookie()) {
    headers.append("set-cookie", cookie);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
};

export const GET = (req: NextRequest, ctx: RouteContext) =>
  proxyRequest(req, ctx, "GET");
export const POST = (req: NextRequest, ctx: RouteContext) =>
  proxyRequest(req, ctx, "POST");
export const PUT = (req: NextRequest, ctx: RouteContext) =>
  proxyRequest(req, ctx, "PUT");
export const PATCH = (req: NextRequest, ctx: RouteContext) =>
  proxyRequest(req, ctx, "PATCH");
export const DELETE = (req: NextRequest, ctx: RouteContext) =>
  proxyRequest(req, ctx, "DELETE");
