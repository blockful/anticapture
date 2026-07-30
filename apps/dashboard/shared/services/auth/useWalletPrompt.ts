"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useCallback } from "react";

/**
 * Wallet prompt for on-chain actions (vote, delegate, publish).
 *
 * Connecting a wallet is not signing in. These actions are authorised by the
 * wallet's own transaction signature and settled on-chain, so all they need is
 * a connected account: RainbowKit opens directly, no SIWE message to sign, and
 * any existing platform session is left untouched.
 *
 * Signing in is a separate, opt-in step, reserved for the surfaces that
 * genuinely need a server session (proposal drafts, API keys). See `useLogin`.
 */
export const useWalletPrompt = () => {
  const { openConnectModal, connectModalOpen } = useConnectModal();

  const promptWalletConnection = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  return {
    promptWalletConnection,
    /** True while the wallet picker is up. */
    promptOpen: connectModalOpen,
  };
};
