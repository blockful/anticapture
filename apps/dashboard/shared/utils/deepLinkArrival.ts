import {
  DEEP_LINK_PULSE_ATTRIBUTE,
  deepLinkSelector,
  pickScrollBlock,
} from "@/shared/utils/deepLink";

/** How often the block's position is checked. */
const TICK_MS = 120;
/** No scroll event for this long means the page is at rest. */
const SCROLL_IDLE_MS = 120;
/** A scroll that has not moved the block after this long is asked for again. */
const SCROLL_RETRY_MS = 600;
/** Give up when the block has not been reached after this long. */
const ARRIVE_TIMEOUT_MS = 10_000;
/** How long after arriving the block is kept in place while the page loads. */
const SETTLE_MS = 8_000;
/** Longer than the animation in globals.css, so the attribute outlives it. */
const PULSE_MS = 2_000;
/** A position change below this is rounding, not movement. */
const TOLERANCE_PX = 2;

/** Input that means the reader is moving the page themself. */
const TAKEOVER_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"];

const pulseTimers = new WeakMap<HTMLElement, number>();

/** Pulses the border of `target` once. Calling it again restarts the pulse. */
export function pulseDeepLinkTarget(target: HTMLElement): void {
  window.clearTimeout(pulseTimers.get(target));
  target.removeAttribute(DEEP_LINK_PULSE_ATTRIBUTE);
  // Reading the layout between the two writes restarts a running animation.
  void target.offsetWidth;
  target.setAttribute(DEEP_LINK_PULSE_ATTRIBUTE, "");
  pulseTimers.set(
    target,
    window.setTimeout(() => {
      target.removeAttribute(DEEP_LINK_PULSE_ATTRIBUTE);
    }, PULSE_MS),
  );
}

/**
 * Takes the reader to the block `slug` names: scrolls to it, then pulses its
 * border once it is at rest. Returns a function that cancels it.
 *
 * The cards above the block load after the page and change height, which
 * moves the block after the scroll. So the block's position is checked for a
 * few seconds, and the scroll is repeated whenever it has moved. It stops as
 * soon as the reader scrolls, clicks or types: from then on the page is
 * theirs.
 *
 * Nothing happens while the tab is in the background, so a link opened in a
 * new tab still scrolls and pulses when the reader gets to it.
 */
export function startDeepLinkArrival(slug: string | null): () => void {
  if (!slug) return () => {};

  const selector = deepLinkSelector(slug);
  const behavior: ScrollBehavior = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches
    ? "auto"
    : "smooth";

  /** First moment the tab was visible: the deadline counts from there. */
  let startedAt: number | null = null;
  let target: HTMLElement | null = null;
  let lastScrollAt = 0;
  /** The block's position and height when the last scroll was asked for, and when. */
  let scrolledFrom: { top: number; height: number; at: number } | null = null;
  let arrivedAt: number | null = null;
  let stopped = false;

  const onScroll = () => {
    lastScrollAt = performance.now();
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(interval);
    window.removeEventListener("scroll", onScroll, true);
    for (const type of TAKEOVER_EVENTS) {
      window.removeEventListener(type, onTakeover, true);
    }
  };

  const isInView = (rect: DOMRect) =>
    rect.top < window.innerHeight && rect.bottom > 0;

  const onTakeover = () => {
    // Interrupted on the way: still show which block the link meant, when it
    // is already on screen.
    if (
      target &&
      arrivedAt === null &&
      isInView(target.getBoundingClientRect())
    ) {
      pulseDeepLinkTarget(target);
    }
    stop();
  };

  const scrollToTarget = (element: HTMLElement, rect: DOMRect, now: number) => {
    scrolledFrom = { top: rect.top, height: rect.height, at: now };
    element.scrollIntoView({
      behavior,
      block: pickScrollBlock(rect.height, window.innerHeight),
      inline: "nearest",
    });
  };

  const tick = () => {
    // The scroll and the pulse are for a reader who is looking at the page.
    if (document.visibilityState !== "visible") return;

    const now = performance.now();
    startedAt ??= now;
    // The block is missing, hidden, or cannot be brought into view.
    if (arrivedAt === null && now - startedAt > ARRIVE_TIMEOUT_MS) {
      stop();
      return;
    }

    if (!target || !target.isConnected) {
      target = document.querySelector<HTMLElement>(selector);
      scrolledFrom = null;
      if (!target) return;
    }

    // A scroll is in progress: wait for it to end.
    if (now - lastScrollAt < SCROLL_IDLE_MS) return;

    const rect = target.getBoundingClientRect();
    // Not rendered (display: none): there is nowhere to scroll to yet.
    if (rect.width === 0 && rect.height === 0) return;
    const moved =
      scrolledFrom === null ||
      Math.abs(rect.top - scrolledFrom.top) > TOLERANCE_PX ||
      Math.abs(rect.height - scrolledFrom.height) > TOLERANCE_PX;

    if (moved) {
      // First scroll, or the block is not as the last scroll left it: the
      // page above it changed height, or the block itself did.
      scrollToTarget(target, rect, now);
      return;
    }

    if (!isInView(rect)) {
      // The scroll was asked for and has not started. Ask again if it never does.
      if (scrolledFrom && now - scrolledFrom.at > SCROLL_RETRY_MS) {
        scrollToTarget(target, rect, now);
      }
      return;
    }

    // Asking for the scroll again changed nothing: the block is in place.
    if (arrivedAt === null) {
      arrivedAt = now;
      pulseDeepLinkTarget(target);
    } else if (now - arrivedAt > SETTLE_MS) {
      stop();
    }
  };

  window.addEventListener("scroll", onScroll, { capture: true, passive: true });
  for (const type of TAKEOVER_EVENTS) {
    window.addEventListener(type, onTakeover, { capture: true, passive: true });
  }
  const interval = window.setInterval(tick, TICK_MS);

  return stop;
}
