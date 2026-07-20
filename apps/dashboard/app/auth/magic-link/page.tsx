import type { Metadata } from "next";
import { headers } from "next/headers";

import { MagicLinkContinue } from "@/shared/components/auth/MagicLinkContinue";
import { resolveWhitelabelDaoIdFromHeaders } from "@/shared/utils/whitelabel";

// Interstitial the magic-link email points at — see MagicLinkContinue for
// why the email can't link the verify endpoint directly.
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function MagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    callbackURL?: string;
  }>;
}) {
  const whitelabelDaoId = resolveWhitelabelDaoIdFromHeaders(await headers());
  const { token, callbackURL } = await searchParams;
  return (
    <MagicLinkContinue
      token={token ?? null}
      callbackURL={callbackURL ?? null}
      whitelabelDaoId={whitelabelDaoId}
    />
  );
}
