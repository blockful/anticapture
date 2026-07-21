import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    chainId: string;
  }>;
};

const SUPPORTED_CHAIN_IDS = new Set(["1", "10", "534352"]);

const getUpstream = (chainId: string) => {
  const erpcUrl = process.env.ERPC_URL;
  const erpcSecret = process.env.ERPC_SECRET;
  if (!erpcUrl || !erpcSecret) return null;

  return {
    url: new URL(`./evm/${chainId}`, `${erpcUrl.replace(/\/+$/, "")}/`),
    secret: erpcSecret,
  };
};

export const POST = async (request: NextRequest, { params }: RouteContext) => {
  const { chainId } = await params;

  if (!SUPPORTED_CHAIN_IDS.has(chainId)) {
    return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
  }

  const upstream = getUpstream(chainId);
  if (!upstream) {
    return NextResponse.json(
      { error: "Wallet RPC service is not configured" },
      { status: 500 },
    );
  }

  const headers = new Headers({
    "content-type": request.headers.get("content-type") ?? "application/json",
    "X-ERPC-Secret-Token": upstream.secret,
  });

  try {
    const upstreamResponse = await fetch(upstream.url, {
      method: "POST",
      headers,
      body: await request.text(),
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    const contentType = upstreamResponse.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch {
    console.error("Wallet RPC proxy request failed");
    return NextResponse.json(
      { error: "Wallet RPC service is unavailable" },
      { status: 502 },
    );
  }
};
