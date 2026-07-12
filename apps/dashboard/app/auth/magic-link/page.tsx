import type { Metadata } from "next";

import { MagicLinkContinue } from "@/shared/components/auth/MagicLinkContinue";

// Interstitial the magic-link email points at — see MagicLinkContinue for
// why the email can't link the verify endpoint directly.
export const metadata: Metadata = {
  title: "Sign in — Anticapture",
  robots: { index: false, follow: false },
};

export default async function MagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; callbackURL?: string }>;
}) {
  const { token, callbackURL } = await searchParams;
  return (
    <MagicLinkContinue
      token={token ?? null}
      callbackURL={callbackURL ?? null}
    />
  );
}
