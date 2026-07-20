"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isAddress } from "viem";
import { useAccount, useDisconnect } from "wagmi";

import { LoginModal } from "@/shared/components/auth/LoginModal";
import { authClient, useSession } from "@/shared/services/auth/client";
import type { DaoIdEnum } from "@/shared/types/daos";

export type OpenLoginOptions = {
  /** Route to navigate to once the user authenticates. */
  redirectTo?: string;
};

type LoginContextValue = {
  /** Opens the sign-in modal. */
  openLogin: (options?: OpenLoginOptions) => void;
  isOpen: boolean;
};

const LoginContext = createContext<LoginContextValue | null>(null);

export function LoginProvider({
  isWhitelabel = false,
  whitelabelDaoId = null,
  children,
}: {
  isWhitelabel?: boolean;
  whitelabelDaoId?: DaoIdEnum | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { status: walletStatus, address } = useAccount();
  const { connectModalOpen } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  // Where to land after sign-in (login-gated pages pass their own route).
  // Cleared when the modal is dismissed without authenticating.
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const openLogin = useCallback((options?: OpenLoginOptions) => {
    setRedirectTo(options?.redirectTo ?? null);
    setIsOpen(true);
  }, []);

  // Wallet ⟷ session coherence. Both effects stand down while the sign-in
  // modal OR RainbowKit's connect modal is up: the ceremony legitimately
  // passes through connected-without-a-session and must never be yanked
  // mid-flight.
  const authFlowActive = isOpen || connectModalOpen;

  // 1. Wallet-born sessions (SIWE stores the wallet address as the user
  //    name) are bound to that wallet: disconnected — now or on a later
  //    visit — means signed out, and switching to a DIFFERENT account in
  //    the wallet signs the old session out and asks for a fresh SIWE, so
  //    on-chain actions and the platform identity can't diverge.
  //    Email/Google sessions are wallet-independent.
  useEffect(() => {
    if (authFlowActive || !session || !isAddress(session.user.name)) return;
    const sessionAddress = session.user.name.toLowerCase();

    if (walletStatus === "disconnected") {
      void authClient.signOut();
      return;
    }
    if (
      walletStatus === "connected" &&
      address &&
      address.toLowerCase() !== sessionAddress
    ) {
      void authClient.signOut();
      openLogin();
    }
  }, [authFlowActive, session, walletStatus, address, openLogin]);

  // 2. And the reverse: a connected wallet with no session reads as "logged
  //    in" in the header while every gated surface asks to sign in. Losing
  //    the session (expiry, sign-out, or an abandoned ceremony) disconnects
  //    the wallet too.
  useEffect(() => {
    if (authFlowActive || isPending || session) return;
    if (walletStatus !== "connected") return;
    disconnect();
  }, [authFlowActive, isPending, session, walletStatus, disconnect]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setRedirectTo(null);
  }, []);

  // Sign-in completion: a session for a NEW user appearing while the modal
  // is open (SIWE verify refreshed the store, a magic link opened in this
  // tab, a gated click that raced session loading, or an email session being
  // replaced by a SIWE one) closes the modal and honors the redirect.
  // Keyed by user id, so an already-signed-in user opening the modal (e.g.
  // to connect a wallet) doesn't get it self-closed.
  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    const userId = session?.user.id ?? null;
    if (isOpen && userId && prevUserId.current !== userId) {
      setIsOpen(false);
      if (redirectTo) router.push(redirectTo);
      setRedirectTo(null);
    }
    prevUserId.current = userId;
  }, [session, isOpen, redirectTo, router]);

  const value = useMemo(() => ({ openLogin, isOpen }), [openLogin, isOpen]);

  return (
    <LoginContext.Provider value={value}>
      {children}
      <LoginModal
        open={isOpen}
        onOpenChangeAction={handleOpenChange}
        isWhitelabel={isWhitelabel}
        whitelabelDaoId={whitelabelDaoId}
        redirectTo={redirectTo}
      />
    </LoginContext.Provider>
  );
}

export function useLogin(): LoginContextValue {
  const ctx = useContext(LoginContext);
  if (!ctx) {
    throw new Error("useLogin must be used within LoginProvider");
  }
  return ctx;
}
