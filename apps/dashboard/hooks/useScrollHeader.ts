/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * @name useScrollHeader
 * @description A custom React hook that creates a responsive header with intelligent scroll behavior
 *
 * This hook provides the following features:
 * - Smart position detection using IntersectionObserver API
 * - Auto-hiding on scroll down, revealing on scroll up
 * - Automatic handling of quick scroll direction changes
 * - Performance optimizations: debounce, throttling and early exits
 * - Dynamic header height measurement with ResizeObserver
 * - Proper cleanup of all event listeners and observers
 * - Fully TypeScript supported with precise typings
 *
 *
 * @returns {Object} An object containing:
 *   - headerRef: Ref to attach to the header element
 *   - observerRef: Ref to attach to the top-of-page detection element
 *   - isVisible: Whether the header should be visible (controlled by scroll direction)
 *   - isAtTop: Whether the page is currently scrolled to the top
 *   - headerHeight: The calculated height of the header (for creating a placeholder)
 */
export const useScrollHeader = () => {
  /**
   * Primary state variables exposed to consumers
   * These control the visibility and positioning of the header
   */
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isAtTop, setIsAtTop] = useState<boolean>(true);
  const [headerHeight, setHeaderHeight] = useState<number>(0);

  /**
   * React refs for DOM elements and internal state tracking
   * Using refs for values that shouldn't trigger re-renders when changed
   */
  const headerRef = useRef<HTMLElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const lastScrollDirection = useRef<
    SCROLL_DIRECTION.UP | SCROLL_DIRECTION.DOWN | null
  >(null);
  const isVisibleRef = useRef<boolean>(true);
  const isAtTopRef = useRef<boolean>(true);
  const scrollTimeoutRef = useRef<number | null>(null);
  const previousScrollTimestamp = useRef<number>(0);

  /**
   * Configuration constants
   * These control the sensitivity and behavior of the header
   */
  const TOP_THRESHOLD = 5; // Pixels from top to consider "at top"
  const SCROLL_AREA_THRESHOLD = 20; // Minimum scroll to start applying effects
  const FAST_SCROLL_THRESHOLD = 0.5; // Speed (px/ms) to consider fast scrolling
  const enum SCROLL_DIRECTION {
    UP = "up",
    DOWN = "down",
  }

  /**
   * Memoized state update functions
   * Only updates state when the value actually changes to prevent unnecessary renders
   */
  const updateIsVisible = useCallback((value: boolean) => {
    if (isVisibleRef.current !== value) {
      isVisibleRef.current = value;
      setIsVisible(value);
    }
  }, []);

  const updateIsAtTop = useCallback((value: boolean) => {
    if (isAtTopRef.current !== value) {
      isAtTopRef.current = value;
      setIsAtTop(value);
    }
  }, []);

  /**
   * Effect for monitoring and updating the header dimensions
   * Uses modern ResizeObserver API for efficient size tracking
   */
  useEffect(() => {
    if (headerRef.current) {
      const headerElement = headerRef.current;
      setHeaderHeight(headerElement.offsetHeight);

      const resizeObserver = new ResizeObserver((entries) => {
        const { contentRect } = entries[0];
        setHeaderHeight(contentRect.height);
      });

      resizeObserver.observe(headerElement);
      return () => resizeObserver.disconnect();
    }
  }, []);

  /**
   * Main effect for scroll monitoring and header visibility management
   * Sets up the intersection observer and scroll listeners
   */
  useEffect(() => {
    // Initialize scroll position tracking
    lastScrollY.current = window.scrollY;
    const initialIsAtTop = window.scrollY <= TOP_THRESHOLD;
    updateIsAtTop(initialIsAtTop);
    isAtTopRef.current = initialIsAtTop;

    /**
     * IntersectionObserver configuration
     * Detects when the observer element is visible at the top of the viewport
     */
    const options = {
      threshold: [0.8], // 80% visibility threshold for stability
      rootMargin: "-5px 0px 0px 0px", // Small negative margin to ensure we're truly at top
    };

    /**
     * Handles intersection events when the observer element enters/exits the viewport
     * This is the primary mechanism for detecting when we're at the top of the page
     */
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const isIntersecting = entries[0].isIntersecting;
      const scrollY = window.scrollY;

      if (isIntersecting && scrollY < TOP_THRESHOLD * 2) {
        updateIsAtTop(true);
        updateIsVisible(true);
      } else if (!isIntersecting || scrollY > SCROLL_AREA_THRESHOLD) {
        updateIsAtTop(false);
      }
    };

    // Create and attach the intersection observer
    const topObserver = new IntersectionObserver(handleIntersect, options);

    if (observerRef.current) {
      topObserver.observe(observerRef.current);
    }

    /**
     * Primary scroll handler function
     * Implements the core logic for header visibility based on scroll direction and position
     */
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const now = performance.now(); // High-precision timestamp
      const timeDelta = now - previousScrollTimestamp.current;
      previousScrollTimestamp.current = now;

      // Early exit for small movements to reduce unnecessary calculations
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      if (scrollDelta < 2 && !isAtTopRef.current) {
        lastScrollY.current = currentScrollY;
        return;
      }

      // Calculate scroll speed only when needed for special fast-scroll handling
      const scrollSpeed = scrollDelta / Math.max(timeDelta, 1);
      const isFastScroll = scrollSpeed > FAST_SCROLL_THRESHOLD;

      // Determine if we're at the top of the page
      const nowAtTop = currentScrollY <= TOP_THRESHOLD;
      if (nowAtTop !== isAtTopRef.current) {
        updateIsAtTop(nowAtTop);
      }

      // Detect scroll direction with minimal calculations
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrollingUp = !scrollingDown && scrollDelta > 0;

      // Update direction tracking only when direction changes
      if (
        scrollingDown &&
        lastScrollDirection.current !== SCROLL_DIRECTION.DOWN
      ) {
        lastScrollDirection.current = SCROLL_DIRECTION.DOWN;
      } else if (
        scrollingUp &&
        lastScrollDirection.current !== SCROLL_DIRECTION.UP
      ) {
        lastScrollDirection.current = SCROLL_DIRECTION.UP;
      }

      // Core visibility logic based on scroll direction and position
      if (!nowAtTop) {
        if (scrollingDown) {
          // Hide header when scrolling down
          updateIsVisible(false);
        } else if (scrollingUp || isFastScroll) {
          // Show header when scrolling up or during fast scrolls
          updateIsVisible(true);
        }
      } else {
        // Always show header when at the top of the page
        updateIsVisible(true);
      }

      // Update last scroll position for next comparison
      lastScrollY.current = currentScrollY;

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };

    /**
     * Throttled scroll handler using requestAnimationFrame
     * Prevents excessive calculations during rapid scroll events
     */
    let ticking = false;

    const optimizedScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Attach scroll listener with passive option for performance
    window.addEventListener("scroll", optimizedScrollHandler, {
      passive: true,
    });

    // Cleanup function to remove all listeners and observers
    return () => {
      window.removeEventListener("scroll", optimizedScrollHandler);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      topObserver.disconnect();
    };
  }, [updateIsAtTop, updateIsVisible]);

  // Return the necessary values and refs for consumer components
  return {
    headerRef,
    observerRef,
    isVisible,
    isAtTop,
    headerHeight,
  };
};
