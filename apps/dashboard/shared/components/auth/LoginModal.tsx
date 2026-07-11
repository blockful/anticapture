"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Mail, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { DefaultLink } from "@/shared/components/design-system/links/default-link/DefaultLink";
import { Logo } from "@/shared/components/design-system/logo/Logo";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { AnticaptureLogo } from "@/shared/components/icons/AnticaptureWatermark";
import { GoogleIcon } from "@/shared/components/icons/GoogleIcon";
import { authClient } from "@/shared/services/auth/client";
import { useAuthMethods } from "@/shared/services/auth/useAuthMethods";
import { useEmailLogin } from "@/shared/services/auth/useEmailLogin";
import { useSiweLogin } from "@/shared/services/auth/useSiweLogin";

export type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whitelabel deployments offer wallet sign-in only (no email/Google). */
  isWhitelabel?: boolean;
  onAuthenticated?: () => void;
  /**
   * Route to land on after sign-in. SIWE navigates via onAuthenticated;
   * the redirect-based methods (magic link, Google) get it as callbackURL.
   */
  redirectTo?: string | null;
};

const RESEND_COOLDOWN_SEC = 30;

type View = "options" | "email" | "sent";

export const LoginModal = ({
  open,
  onOpenChange,
  isWhitelabel = false,
  onAuthenticated,
  redirectTo,
}: LoginModalProps) => {
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { isConnected } = useAccount();
  const [view, setView] = useState<View>("options");
  const [email, setEmail] = useState("");

  const siwe = useSiweLogin(() => {
    onOpenChange(false);
    onAuthenticated?.();
  });
  const emailLogin = useEmailLogin();

  // The server reports which methods its deployment actually serves (magic
  // link / Google are env-gated there); a method it can't handle is hidden
  // rather than shown broken. Whitelabel is wallet-only by design.
  const methods = useAuthMethods(!isWhitelabel && open);
  const showEmail = !isWhitelabel && methods.magicLink;
  const showGoogle = !isWhitelabel && methods.google;
  const showAlternatives = showEmail || showGoogle;
  const siweBusy = siwe.status !== "idle" && siwe.status !== "error";

  // If RainbowKit was dismissed without a wallet connecting, drop the pending
  // SIWE flow so the button doesn't come back stuck on "Connecting…". The
  // grace timer absorbs the race where RainbowKit closes an instant before
  // wagmi reports the new connection (a connect cancels the timer via deps).
  const { status: siweStatus, reset: siweReset } = siwe;
  useEffect(() => {
    if (connectModalOpen || isConnected || siweStatus !== "connecting") return;
    const timer = setTimeout(siweReset, 500);
    return () => clearTimeout(timer);
  }, [connectModalOpen, isConnected, siweStatus, siweReset]);

  // A previous attempt can settle after the modal closed and was reset (e.g.
  // a wallet prompt rejected late), leaving a stale error/status behind —
  // start every (re)open clean. `open` is the provider prop, which stays true
  // during the RainbowKit hand-off, so this never clobbers a live ceremony.
  const { reset: emailReset } = emailLogin;
  useEffect(() => {
    if (!open) return;
    siweReset();
    emailReset();
  }, [open, siweReset, emailReset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setView("options");
      setEmail("");
      siwe.reset();
      emailLogin.reset();
    }
    onOpenChange(next);
  };

  const callbackURL = () =>
    redirectTo ? window.location.origin + redirectTo : window.location.href;

  const submitEmail = async () => {
    if (await emailLogin.send(email.trim(), callbackURL())) setView("sent");
  };

  const signInWithGoogle = () =>
    authClient.signIn.social({
      provider: "google",
      callbackURL: callbackURL(),
    });

  return (
    <Modal
      // Hidden (not closed) while RainbowKit's connect modal is up: both are
      // focus-trapping dialogs, so stacked they block each other's clicks.
      // This component stays mounted, so the pending SIWE flow survives and
      // the modal comes back in the signing state once the wallet connects.
      open={open && !connectModalOpen}
      onOpenChange={handleOpenChange}
      ariaLabel="Sign in to Anticapture"
      className="max-w-100"
      bodyClassName="flex flex-col items-center gap-6 p-5"
    >
      {/* Whitelabel keeps the neutral mark; the main app shows the wordmark. */}
      {isWhitelabel ? (
        <Logo variant="brand" size="md" />
      ) : (
        <AnticaptureLogo
          className="text-highlight h-8 w-auto"
          aria-label="Anticapture"
          role="img"
        />
      )}

      {view === "sent" ? (
        <div className="flex w-full flex-col gap-4">
          <ModalHeading
            title="Check your inbox"
            subtitle={
              <>
                We sent a sign-in link to
                <br />
                <span className="text-primary">{email}</span>
              </>
            }
          />
          <ResendButton onResend={() => emailLogin.send(email.trim())} />
          <BackButton onClick={() => setView("options")} />
        </div>
      ) : view === "email" ? (
        <div className="flex w-full flex-col gap-4">
          <ModalHeading
            title="Sign in with email"
            subtitle="We'll email you a link to sign in."
          />
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitEmail();
            }}
          >
            <Input
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              value={email}
              error={emailLogin.status === "error"}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={emailLogin.status === "sending"}
              loadingText="Sending…"
            >
              Send login link
            </Button>
          </form>
          {emailLogin.error && <ErrorText>{emailLogin.error}</ErrorText>}
          <BackButton onClick={() => setView("options")} />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <ModalHeading
            title="Sign in to Anticapture"
            subtitle={
              <>
                One account for everything.
                <br />
                Use your wallet, or just your email.
              </>
            }
          />

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={siweBusy}
            loadingText={
              siwe.status === "connecting"
                ? "Connecting…"
                : siwe.status === "signing"
                  ? "Check your wallet…"
                  : "Signing in…"
            }
            onClick={() => siwe.login(() => openConnectModal?.())}
          >
            <Wallet className="size-4" />
            Connect wallet
          </Button>

          {siwe.error && <ErrorText>{siwe.error}</ErrorText>}

          {showAlternatives && (
            <>
              <div className="flex w-full items-center gap-2">
                <DividerDefault isHorizontal />
                <span className="text-secondary text-sm leading-5">or</span>
                <DividerDefault isHorizontal />
              </div>

              <div className="flex w-full gap-2">
                {showEmail && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => setView("email")}
                  >
                    <Mail className="size-4" />
                    Email
                  </Button>
                )}
                {showGoogle && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => void signInWithGoogle()}
                  >
                    <GoogleIcon className="size-4" />
                    Google
                  </Button>
                )}
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
      )}
    </Modal>
  );
};

const ModalHeading = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: React.ReactNode;
}) => (
  <div className="flex flex-col items-center gap-1 text-center">
    <h2 className="text-primary text-base font-semibold leading-6">{title}</h2>
    <p className="text-secondary text-sm leading-5">{subtitle}</p>
  </div>
);

const ErrorText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-error text-center text-xs" role="alert">
    {children}
  </p>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-secondary hover:text-primary mx-auto flex items-center gap-1 text-sm transition-colors"
  >
    <ArrowLeft className="size-3.5" />
    Back
  </button>
);

const ResendButton = ({ onResend }: { onResend: () => Promise<boolean> }) => {
  // The link was just sent when this mounts, so start on cooldown.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    if (cooldown > 0) return;
    if (await onResend()) setCooldown(RESEND_COOLDOWN_SEC);
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      disabled={cooldown > 0}
      onClick={() => void resend()}
    >
      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
    </Button>
  );
};
