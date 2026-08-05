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
  redirectTo?: string;
  onDismiss?: () => void;
};

type LoginContextValue = {
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
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const onDismissRef = useRef<(() => void) | null>(null);

  const openLogin = useCallback((options?: OpenLoginOptions) => {
    setRedirectTo(options?.redirectTo ?? null);
    onDismissRef.current = options?.onDismiss ?? null;
    setIsOpen(true);
  }, []);

  const authFlowActive = isOpen || connectModalOpen;

  useEffect(() => {
    if (authFlowActive || !session) return;
    const stale = isWalletSessionStale({
      sessionUserName: session.user.name,
      walletStatus,
      address,
    });
    if (stale) void authClient.signOut();
  }, [authFlowActive, session, walletStatus, address]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) return;
    setRedirectTo(null);
    const onDismiss = onDismissRef.current;
    onDismissRef.current = null;
    onDismiss?.();
  }, []);

  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    const userId = session?.user.id ?? null;
    if (isOpen && userId && prevUserId.current !== userId) {
      setIsOpen(false);
      if (redirectTo) router.push(redirectTo);
      setRedirectTo(null);
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
