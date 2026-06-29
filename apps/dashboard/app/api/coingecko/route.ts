import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAddress } from "viem";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

// CoinGecko "asset platform" id per EVM chain. The create-proposal flow is ENS /
// mainnet today; extend this map as more chains gain proposal support.
const PLATFORM_BY_CHAIN: Record<string, string> = {
  "1": "ethereum",
};

// Demo/Pro CoinGecko keys raise the per-key rate limit well above the shared
// anonymous bucket. Optional: when unset we still proxy anonymously, just with
// the public limits.
const withKey = (url: string): string => {
  const key = process.env.COINGECKO_API_KEY;
  if (!key) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}x_cg_demo_api_key=${key}`;
};

/**
 * Server-side proxy for CoinGecko price lookups (mirrors the /api/etherscan
 * pattern). Browsers hitting the public CoinGecko endpoints directly share one
 * anonymous rate-limit bucket per IP and routinely get 429s, which is why USD
 * conversions intermittently fail to render. Routing through here collapses all
 * users onto a single cached request per asset per minute and lets us attach an
 * optional API key that never reaches the client.
 *
 * Returns `{ usd: number | null }`; `null` means "no listing / unsupported
 * chain" and callers degrade gracefully (no USD shown) rather than erroring.
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
      // Unsupported chain — treat as "no price available", not an error.
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
