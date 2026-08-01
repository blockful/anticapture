"use client";

import { useAccount } from "wagmi";

import { useSession } from "@/shared/services/auth/client";
import { isWalletSessionStale } from "@/shared/services/auth/walletSession";

/**
 * `useSession`, gated on the session still matching the connected wallet.
 *
 * Every surface that acts on behalf of the session (drafts, API keys, the
 * account chip) reads this instead of `useSession` directly: a session whose
 * wallet binding broke reads as no session at all, immediately, rather than
 * staying usable for the lifetime of the pending sign-out request. See
 * `isWalletSessionStale`.
 *
 * `useSession` itself remains the right call for the sign-out machinery in
 * `LoginProvider`, which needs the session that is actually still there.
 */
export const useAuthSession = () => {
  const session = useSession();
  const { status: walletStatus, address } = useAccount();

  const stale = isWalletSessionStale({
    sessionUserName: session.data?.user.name,
    walletStatus,
    address,
  });

  return stale ? { ...session, data: null } : session;
};
