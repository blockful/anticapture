import { NextResponse } from "next/server";

import { fetchSppSource } from "@/features/service-providers/utils/fetchSppSource";

// The repository changes a few times per quarter. Five minutes keeps a merged
// report visible quickly and keeps this server to a handful of GitHub requests
// per hour, far below GitHub's unauthenticated limits.
const REVALIDATE_SECONDS = 300;

/**
 * Server-side read of the ensdao/spp files behind the Service Providers page.
 * Returns `{ config, programsConfig, avatarUrls }`, or 502 when GitHub does
 * not serve the two required files.
 */
export async function GET() {
  try {
    const source = await fetchSppSource((url) =>
      fetch(url, { next: { revalidate: REVALIDATE_SECONDS } }),
    );
    return NextResponse.json(source, {
      headers: {
        "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch service provider data",
      },
      { status: 502 },
    );
  }
}
