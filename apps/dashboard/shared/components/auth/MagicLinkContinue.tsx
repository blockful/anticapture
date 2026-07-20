"use client";

import { useEffect, useMemo } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { AnticaptureLogo } from "@/shared/components/icons/AnticaptureWatermark";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

/**
 * Magic-link landing: the email links here instead of the verify endpoint,
 * because mail pipelines prefetch links with plain GETs and the verify
 * endpoint consumes its single-use token on the first hit. This page
 * triggers the verify from the browser — JS that prefetchers don't run —
 * with a manual button as fallback.
 */
export const MagicLinkContinue = ({
  token,
  callbackURL,
  whitelabelDaoId,
}: {
  token: string | null;
  callbackURL: string | null;
  whitelabelDaoId: DaoIdEnum | null;
}) => {
  // Same-origin by construction (relative path) — the target route is fixed
  // and only the query is caller-controlled; the server validates
  // callbackURL against its trusted origins before redirecting.
  const verifyUrl = useMemo(() => {
    if (!token) return null;
    const params = new URLSearchParams({ token });
    if (callbackURL) params.set("callbackURL", callbackURL);
    return `/api/auth/magic-link/verify?${params.toString()}`;
  }, [token, callbackURL]);

  useEffect(() => {
    if (verifyUrl) window.location.replace(verifyUrl);
  }, [verifyUrl]);

  const DaoIcon = whitelabelDaoId
    ? daoConfigByDaoId[whitelabelDaoId]?.icon
    : undefined;

  return (
    <div className="bg-surface-background dark flex min-h-screen w-full flex-col items-center justify-center gap-6 p-5 text-center">
      {DaoIcon ? (
        <DaoIcon className="size-12 rounded" aria-hidden />
      ) : (
        <AnticaptureLogo
          className="text-highlight h-8 w-auto"
          aria-label="Anticapture"
          role="img"
        />
      )}
      {verifyUrl ? (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-primary text-base font-semibold leading-6">
              Signing you in…
            </h1>
            <p className="text-secondary text-sm leading-5">
              You&apos;ll be redirected in a moment.
            </p>
          </div>
          <Button variant="outline" size="md" asChild>
            <a href={verifyUrl}>Continue</a>
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-primary text-base font-semibold leading-6">
              This sign-in link is invalid
            </h1>
            <p className="text-secondary text-sm leading-5">
              Request a new link from the sign-in dialog.
            </p>
          </div>
          <Button variant="outline" size="md">
            <a href="/">Back to {whitelabelDaoId ? `Login` : "Anticapture"}</a>
          </Button>
        </>
      )}
    </div>
  );
};
