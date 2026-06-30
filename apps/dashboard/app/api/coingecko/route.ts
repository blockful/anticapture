import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAddress } from "viem";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

// CoinGecko asset-platform id per chain id.
const PLATFORM_BY_CHAIN: Record<string, string> = {
  "1": "ethereum",
};

// Appends the optional CoinGecko API key, when configured.
const withKey = (url: string): string => {
  const key = process.env.COINGECKO_API_KEY;
  if (!key) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}x_cg_demo_api_key=${key}`;
};

/**
 * Server-side proxy for CoinGecko price lookups. Returns `{ usd: number | null }`
 * (null = no listing / unsupported chain).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");

  if (kind === "eth") {
    const upstream = await fetch(
      withKey(`${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd`),
      { next: { revalidate: 60 } },
    );
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ETH price" },
        { status: upstream.status },
      );
    }
    const data = (await upstream.json()) as { ethereum?: { usd?: number } };
    return NextResponse.json({ usd: data?.ethereum?.usd ?? null });
  }

  if (kind === "token") {
    const chainId = searchParams.get("chainId") ?? "";
    const address = searchParams.get("address") ?? "";
    const platform = PLATFORM_BY_CHAIN[chainId];
    if (!platform) {
      return NextResponse.json({ usd: null });
    }
    if (!isAddress(address, { strict: false })) {
      return NextResponse.json(
        { error: "Invalid or missing address parameter" },
        { status: 400 },
      );
    }
    const normalized = address.toLowerCase();
    const upstream = await fetch(
      withKey(
        `${COINGECKO_API}/simple/token_price/${platform}?contract_addresses=${normalized}&vs_currencies=usd`,
      ),
      { next: { revalidate: 60 } },
    );
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Failed to fetch token price" },
        { status: upstream.status },
      );
    }
    const data = (await upstream.json()) as Record<string, { usd?: number }>;
    return NextResponse.json({ usd: data?.[normalized]?.usd ?? null });
  }

  return NextResponse.json(
    { error: "Invalid or missing kind parameter" },
    { status: 400 },
  );
}
