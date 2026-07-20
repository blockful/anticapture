"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useCallback } from "react";

import { useSession } from "@/shared/services/auth/client";
import { useLogin } from "@/shared/services/auth/LoginProvider";

/**
 * Wallet prompt for on-chain actions (vote, delegate, publish).
 *
 * Signed OUT, connecting a wallet IS signing in, so the sign-in modal runs
 * the full SIWE ceremony. Signed IN with a wallet-less session (magic link /
 * Google), the user just needs a wallet to SIGN TRANSACTIONS — RainbowKit
 * opens directly and the platform session is left untouched (running SIWE
 * would silently replace their account, since v1 has no linking). The
 * wallet/session coherence sync tolerates this pairing: it only ties
 * wallet-born sessions to their wallet.
 */
export const useWalletPrompt = () => {
  const { data: session } = useSession();
  const { openLogin, isOpen: isLoginOpen } = useLogin();
  const { openConnectModal, connectModalOpen } = useConnectModal();

  const promptWalletConnection = useCallback(() => {
    if (session) {
      openConnectModal?.();
    } else {
      openLogin();
    }
  }, [session, openConnectModal, openLogin]);

  return {
    promptWalletConnection,
    /** True while either prompt (sign-in modal or RainbowKit) is up. */
    promptOpen: isLoginOpen || connectModalOpen,
  };
};
