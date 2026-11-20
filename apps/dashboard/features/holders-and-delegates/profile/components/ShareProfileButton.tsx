"use client";

import { Check, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/components";

const FEEDBACK_MS = 2_000;

// Phones get the native share sheet; desktops, where it is a detour, a copy.
const prefersNativeShare = () =>
  typeof navigator.share === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

/** Shares the profile URL, without the tab and filter state of this visit. */
export const ShareProfileButton = ({ title }: { title: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;

    if (prefersNativeShare()) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Dismissing the sheet is not a failure.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Native share failed, copying instead", error);
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setIsCopied(false), FEEDBACK_MS);
    } catch (error) {
      console.error("Failed to copy the profile link", error);
    }
  };

  return (
    <Button
      variant="outline"
      size="md"
      onClick={handleShare}
      aria-live="polite"
      data-umami-event="address_profile_share"
    >
      {isCopied ? (
        <Check className="size-3.5" />
      ) : (
        <Share2 className="size-3.5" />
      )}
      {isCopied ? "Link copied" : "Share"}
    </Button>
  );
};
