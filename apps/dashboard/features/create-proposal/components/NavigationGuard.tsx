"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LeaveWithoutSavingModal } from "@/features/create-proposal/components/modals/LeaveWithoutSavingModal";

interface NavigationGuardProps {
  isDirty: boolean;
  allowedPathname: string;
  onLeave: () => void;
}

export const NavigationGuard = ({
  isDirty,
  allowedPathname,
  onLeave,
}: NavigationGuardProps) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const isDirtyRef = useRef(isDirty);
  const beforeUnloadHandlerRef = useRef<
    ((e: BeforeUnloadEvent) => void) | null
  >(null);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    beforeUnloadHandlerRef.current = handleBeforeUnload;

    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (anchor.target && anchor.target !== "_self") return;

      const interactive = (e.target as HTMLElement).closest(
        "button, input, select, textarea, [role='button']",
      );
      if (interactive && anchor.contains(interactive)) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === allowedPathname) return;

      e.preventDefault();
      pendingHrefRef.current = url.pathname + url.search + url.hash;
      setShowModal(true);
    };

    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      if (window.location.pathname === allowedPathname) return;
      window.history.pushState(null, "", allowedPathname);
      pendingHrefRef.current = null;
      setShowModal(true);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("popstate", handlePopState);
      beforeUnloadHandlerRef.current = null;
    };
  }, [isDirty, allowedPathname]);

  return (
    <LeaveWithoutSavingModal
      open={showModal}
      onOpenChange={setShowModal}
      onLeave={() => {
        setShowModal(false);
        const pending = pendingHrefRef.current;
        pendingHrefRef.current = null;
        // Detach beforeunload BEFORE navigating — otherwise the programmatic
        // navigation (router.push / full reload on external links) re-fires
        // the browser's native confirmation dialog on top of our own modal.
        // We also flip the dirty ref so the click/popstate guards stop
        // intercepting while the transition is in flight.
        isDirtyRef.current = false;
        if (beforeUnloadHandlerRef.current) {
          window.removeEventListener(
            "beforeunload",
            beforeUnloadHandlerRef.current,
          );
          beforeUnloadHandlerRef.current = null;
        }
        if (pending) {
          // Internal navigation — stay on the SPA route stack instead of
          // forcing a full reload with window.location.href.
          router.push(pending);
        } else {
          onLeave();
        }
      }}
    />
  );
};
