"use client";

import { Check, Link2 } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/utils/cn";
import { buildDeepLinkUrl } from "@/shared/utils/deepLink";

/** How long the confirmation stays next to the title. */
const FEEDBACK_MS = 2_000;

type Feedback = "copied" | "address-bar";

type DeepLinkTitleProps = {
  /**
   * The block this title names, as marked with `deepLinkTarget(slug)`. It is
   * the hash of the shared link, so it is a fixed string: a title can be
   * reworded without breaking a link someone already shared.
   */
  slug: string;
  /** The title text. */
  children: string;
  /** Shown right after the title: the info tooltip. */
  info?: ReactNode;
  className?: string;
};

/**
 * Title of a block of data that is also the link to it. A click puts the
 * link in the address bar and copies it; a link icon shows on hover so the
 * title reads as clickable. Opening the link is handled by `DeepLinkArrival`.
 */
export const DeepLinkTitle = ({
  slug,
  children,
  info,
  className,
}: DeepLinkTitleProps) => {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copyLink = async (event: MouseEvent<HTMLElement>) => {
    // A modified click opens the link in a new tab or window, as usual.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();

    const url = buildDeepLinkUrl(window.location.href, slug);
    // replaceState: the page does not scroll and the back button is untouched.
    window.history.replaceState(null, "", url);

    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      // No clipboard access: the link is still in the address bar.
    }

    setFeedback(copied ? "copied" : "address-bar");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
  };

  return (
    <div
      className={cn(
        "group/deep-link flex min-w-0 items-center gap-1.5",
        className,
      )}
    >
      <a
        href={`#${slug}`}
        onClick={copyLink}
        className="text-secondary hover:text-primary focus-visible:text-primary text-sm font-medium transition-colors"
        data-umami-event="deep_link_copy"
        data-umami-event-slug={slug}
        data-ph-event="deep_link_copy"
        data-ph-slug={slug}
      >
        {children}
      </a>
      {/* On a phone the confirmation takes the place of the info icon for a
          moment, so the row keeps its width and the title does not rewrap. */}
      {info && (
        <span
          className={cn(
            "flex shrink-0 items-center",
            feedback && "max-lg:hidden",
          )}
        >
          {info}
        </span>
      )}
      {/* Read out by screen readers; out of the layout, so it takes no room. */}
      <span role="status" className="sr-only">
        {feedback === "copied" && "Link copied"}
        {feedback === "address-bar" && "Link is in the address bar"}
      </span>
      {feedback === "copied" && (
        <span
          aria-hidden="true"
          className="text-success flex shrink-0 items-center gap-1 text-xs font-medium"
        >
          <Check className="size-3.5" />
          <span className="hidden lg:inline">Link copied</span>
        </span>
      )}
      {feedback === "address-bar" && (
        <span
          aria-hidden="true"
          className="text-secondary flex shrink-0 items-center gap-1 text-xs font-medium"
        >
          <Link2 className="size-3.5 lg:hidden" />
          <span className="hidden lg:inline">Link is in the address bar</span>
        </span>
      )}
      {/* Hover affordance: desktop only, so it reserves no room on a phone. */}
      {feedback === null && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={copyLink}
          className="text-secondary hover:text-primary hidden shrink-0 cursor-pointer border-0 bg-transparent p-0 opacity-0 transition-opacity group-focus-within/deep-link:opacity-100 group-hover/deep-link:opacity-100 lg:block"
        >
          <Link2 className="size-3.5" />
        </button>
      )}
    </div>
  );
};
