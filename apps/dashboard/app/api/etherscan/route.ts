import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ETHERSCAN_V2_ENDPOINT = "https://api.etherscan.io/v2/api";

const isValidAddress = (address: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/.test(address);

const isValidChainId = (chainId: string): boolean => /^[0-9]+$/.test(chainId);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainid = searchParams.get("chainid");
  const address = searchParams.get("address");

  if (!chainid || !isValidChainId(chainid)) {
    return NextResponse.json(
      { error: "Invalid or missing chainid parameter" },
      { status: 400 },
    );
  }
  if (!address || !isValidAddress(address)) {
    return NextResponse.json(
      { error: "Invalid or missing address parameter" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Etherscan service is not configured" },
      { status: 500 },
    );
  }

  const upstreamParams = new URLSearchParams({
    chainid,
    module: "contract",
    action: "getabi",
    address,
    apikey: apiKey,
  });

  const upstream = await fetch(
    `${ETHERSCAN_V2_ENDPOINT}?${upstreamParams.toString()}`,
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to fetch contract ABI" },
      { status: upstream.status },
    );
  }

  const json = await upstream.json();
  return NextResponse.json(json);
}
