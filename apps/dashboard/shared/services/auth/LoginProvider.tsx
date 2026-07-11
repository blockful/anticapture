"use client";

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

export type OpenLoginOptions = {
  /** Route to navigate to once the user authenticates. */
  redirectTo?: string;
};

type LoginContextValue = {
  /** Opens the sign-in modal. */
  openLogin: (options?: OpenLoginOptions) => void;
  /** Closes the sign-in modal. */
  closeLogin: () => void;
  isOpen: boolean;
};

const LoginContext = createContext<LoginContextValue | null>(null);

export function LoginProvider({
  isWhitelabel = false,
  children,
}: {
  isWhitelabel?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { status: walletStatus } = useAccount();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  // Where to land after sign-in (login-gated pages pass their own route).
  // Cleared when the modal is dismissed without authenticating.
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Wallet ⟷ session coherence. Both effects stand down while the sign-in
  // modal is open: the ceremony legitimately passes through
  // connected-without-a-session, and must never be yanked mid-flight.
  //
  // 1. Wallet-born sessions (SIWE stores the wallet address as the user
  //    name) die with the wallet: disconnected — now or on a later visit —
  //    means signed out. Email/Google sessions are wallet-independent.
  useEffect(() => {
    if (isOpen || !session || walletStatus !== "disconnected") return;
    if (isAddress(session.user.name)) void authClient.signOut();
  }, [isOpen, session, walletStatus]);

  // 2. And the reverse: a connected wallet with no session reads as "logged
  //    in" in the header while every gated surface asks to sign in. Losing
  //    the session (expiry, sign-out, or an abandoned ceremony) disconnects
  //    the wallet too.
  useEffect(() => {
    if (isOpen || isPending || session) return;
    if (walletStatus !== "connected") return;
    disconnect();
  }, [isOpen, isPending, session, walletStatus, disconnect]);

  const openLogin = useCallback((options?: OpenLoginOptions) => {
    setRedirectTo(options?.redirectTo ?? null);
    setIsOpen(true);
  }, []);
  const closeLogin = useCallback(() => setIsOpen(false), []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setRedirectTo(null);
  }, []);

  // Sign-in completion: a session APPEARING while the modal is open (SIWE
  // verify refreshed the store, a magic link opened in this tab, or a gated
  // click that raced session loading and resolved signed-in) closes the
  // modal and honors the redirect. Transition-only, so an already-signed-in
  // user opening the modal doesn't get it self-closed.
  const hadSession = useRef(false);
  useEffect(() => {
    const has = !!session;
    if (isOpen && has && !hadSession.current) {
      setIsOpen(false);
      if (redirectTo) router.push(redirectTo);
      setRedirectTo(null);
    }
    hadSession.current = has;
  }, [session, isOpen, redirectTo, router]);

  const value = useMemo(
    () => ({ openLogin, closeLogin, isOpen }),
    [openLogin, closeLogin, isOpen],
  );

  return (
    <LoginContext.Provider value={value}>
      {children}
      <LoginModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        isWhitelabel={isWhitelabel}
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
