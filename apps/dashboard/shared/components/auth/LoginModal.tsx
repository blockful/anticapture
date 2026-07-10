"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Mail, Wallet } from "lucide-react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { DefaultLink } from "@/shared/components/design-system/links/default-link/DefaultLink";
import { Logo } from "@/shared/components/design-system/logo/Logo";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { GoogleIcon } from "@/shared/components/icons/GoogleIcon";
import { useSiweLogin } from "@/shared/services/auth/useSiweLogin";

export type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whitelabel deployments offer wallet sign-in only (no email/Google). */
  isWhitelabel?: boolean;
  onAuthenticated?: () => void;
};

export const LoginModal = ({
  open,
  onOpenChange,
  isWhitelabel = false,
  onAuthenticated,
}: LoginModalProps) => {
  const { openConnectModal } = useConnectModal();
  const { login, status, error, reset } = useSiweLogin(() => {
    onOpenChange(false);
    onAuthenticated?.();
  });

  const isBusy = status !== "idle" && status !== "error";

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      ariaLabel="Sign in to Anticapture"
      className="max-w-100"
      bodyClassName="flex flex-col items-center gap-6 p-5"
    >
      <Logo variant="brand" size="md" />

      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="text-primary text-base font-semibold leading-6">
            Sign in to Anticapture
          </h2>
          <p className="text-secondary text-sm leading-5">
            One account for everything.
            <br />
            Use your wallet, or just your email.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isBusy}
          loadingText={
            status === "connecting"
              ? "Connecting…"
              : status === "signing"
                ? "Check your wallet…"
                : "Signing in…"
          }
          onClick={() => login(() => openConnectModal?.())}
        >
          <Wallet className="size-4" />
          Connect wallet
        </Button>

        {error && (
          <p className="text-error text-center text-xs" role="alert">
            {error}
          </p>
        )}

        {!isWhitelabel && (
          <>
            <div className="flex w-full items-center gap-2">
              <DividerDefault isHorizontal />
              <span className="text-secondary text-sm leading-5">or</span>
              <DividerDefault isHorizontal />
            </div>

            <div className="flex w-full gap-2">
              {/* Email (magic link) and Google land with the Phase 5 server
                  plugins; shown per design, disabled until then. */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled
                title="Coming soon"
              >
                <Mail className="size-4" />
                Email
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled
                title="Coming soon"
              >
                <GoogleIcon className="size-4" />
                Google
              </Button>
            </div>
          </>
        )}

        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-dimmed text-xs font-medium leading-4">
            By continuing, you agree to the
          </span>
          <DefaultLink
            href="/terms-of-service"
            openInNewTab
            size="sm"
            className="text-dimmed hover:text-secondary"
          >
            Terms of Use &amp; Privacy Policy
          </DefaultLink>
        </div>
      </div>
    </Modal>
  );
};
