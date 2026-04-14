import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const buildUpstreamUrl = (request: NextRequest, path: string[]) => {
  const upstreamUrl = new URL(
    path.join("/"),
    `${process.env.NEXT_PUBLIC_GATEFUL_URL}/`,
  );
  upstreamUrl.search = new URL(request.url).search;
  return upstreamUrl;
};

const getForwardHeaders = (request: NextRequest) => {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  const token = process.env.GATEFUL_API_TOKEN;
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
};

const proxyRequest = async (
  request: NextRequest,
  { params }: RouteContext,
  method: string,
) => {
  const resolvedParams = await params;
  const path = resolvedParams.path ?? [];

  const upstreamResponse = await fetch(buildUpstreamUrl(request, path), {
    method,
    headers: getForwardHeaders(request),
    body:
      method === "GET" || method === "HEAD" ? undefined : await request.text(),
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: upstreamResponse.headers,
  });
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, "POST");
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, "PUT");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, "PATCH");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, "DELETE");
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, "HEAD");
}
