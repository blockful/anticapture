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
import { useAccount } from "wagmi";

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
  const { data: session } = useSession();
  const { status: walletStatus } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  // Where to land after sign-in (login-gated pages pass their own route).
  // Cleared when the modal is dismissed without authenticating.
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Wallet-born sessions (SIWE stores the wallet address as the user name)
  // live and die with the wallet: a disconnected wallet — whether the user
  // just disconnected or arrived without one — signs the platform session
  // out too, so "wallet disconnected" never reads as "still logged in".
  // Email/Google sessions are wallet-independent and untouched. wagmi's
  // initial "connecting"/"reconnecting" states are ignored so an
  // auto-reconnect settles before any decision.
  useEffect(() => {
    if (!session || walletStatus !== "disconnected") return;
    if (isAddress(session.user.name)) void authClient.signOut();
  }, [session, walletStatus]);

  const openLogin = useCallback((options?: OpenLoginOptions) => {
    setRedirectTo(options?.redirectTo ?? null);
    setIsOpen(true);
  }, []);
  const closeLogin = useCallback(() => setIsOpen(false), []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setRedirectTo(null);
  }, []);

  const handleAuthenticated = useCallback(() => {
    if (redirectTo) router.push(redirectTo);
  }, [redirectTo, router]);

  // A session APPEARING while the modal is open means the user just
  // authenticated (SIWE in-modal, a magic link opened in this tab, or a
  // gated click that raced session loading and resolved signed-in): close
  // the modal and honor the redirect. Transition-only — opening the modal
  // while already signed in (e.g. an email user connecting a wallet to
  // vote) must not self-close.
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
        onAuthenticated={handleAuthenticated}
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
