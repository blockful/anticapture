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
import { useAccount } from "wagmi";

import { LoginModal } from "@/shared/components/auth/LoginModal";
import { authClient, useSession } from "@/shared/services/auth/client";
import { isWalletSessionStale } from "@/shared/services/auth/walletSession";
import type { DaoIdEnum } from "@/shared/types/daos";

export type OpenLoginOptions = {
  /** Route to navigate to once the user authenticates. */
  redirectTo?: string;
  /**
   * Ran when the author dismisses the modal, so a caller that staged something
   * for the post-sign-in route can undo it.
   *
   * Dismissal is the only close that runs it. Sign-in completion closes the
   * modal through the effect below, which drops this first, and a flow that
   * leaves the page (magic link, OAuth) never closes it at all — that tab
   * unloads with the staging still valid, which is the whole reason staging
   * outlives this component.
   */
  onDismiss?: () => void;
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
  const { data: session } = useSession();
  const { status: walletStatus, address } = useAccount();
  const { connectModalOpen } = useConnectModal();
  const [isOpen, setIsOpen] = useState(false);
  // Where to land after sign-in (login-gated pages pass their own route).
  // Cleared when the modal is dismissed without authenticating.
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Held in a ref, and dropped as soon as it runs or the flow completes, so a
  // later opening can never run the previous caller's undo.
  const onDismissRef = useRef<(() => void) | null>(null);

  const openLogin = useCallback((options?: OpenLoginOptions) => {
    setRedirectTo(options?.redirectTo ?? null);
    onDismissRef.current = options?.onDismiss ?? null;
    setIsOpen(true);
  }, []);

  // Wallet ⟷ session coherence. Stands down while the sign-in modal OR
  // RainbowKit's connect modal is up: the ceremony legitimately passes
  // through connected-without-a-session and must never be yanked mid-flight.
  const authFlowActive = isOpen || connectModalOpen;

  // Wallet-born sessions (SIWE stores the wallet address as the user name)
  // stay bound to that wallet: disconnecting it, now or on a later visit,
  // means signed out, and switching to a DIFFERENT account signs the old
  // session out, so on-chain actions and the platform identity can't diverge.
  // Email/Google sessions are wallet-independent.
  //
  // The reverse does NOT hold: a connected wallet without a session is a
  // perfectly valid state. Connecting is not signing in, and everything
  // on-chain (vote, delegate, publish) works from the connection alone, so
  // nothing here disconnects the wallet and nothing re-opens the sign-in
  // modal on its own. Signing in is always something the user asks for.
  //
  // Sign-out is the cleanup, not the gate. It is a request: it can be in
  // flight, and it can fail. What actually keeps the old account safe is
  // `isWalletSessionStale`, which every session-backed surface reads through
  // `useAuthSession` and which is true from the render the mismatch appears.
  useEffect(() => {
    if (authFlowActive || !session) return;
    const stale = isWalletSessionStale({
      sessionUserName: session.user.name,
      walletStatus,
      address,
    });
    if (stale) void authClient.signOut();
  }, [authFlowActive, session, walletStatus, address]);

  // Whatever is still in the ref by the time this runs is an undo nobody
  // claimed, so it runs unconditionally. Deliberately not gated on there being
  // no session: this component reads `useSession` while its callers gate on
  // `useAuthSession`, and the two disagree for a stale wallet session — which
  // this modal being open actively keeps alive, since `authFlowActive` stands
  // the sign-out effect down. Gating here would skip the undo in exactly the
  // case the caller was signed out from. Completion clears the ref itself.
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) return;
    setRedirectTo(null);
    const onDismiss = onDismissRef.current;
    onDismissRef.current = null;
    onDismiss?.();
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
      // The staging this guarded is being used, so there is nothing to undo.
      onDismissRef.current = null;
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
