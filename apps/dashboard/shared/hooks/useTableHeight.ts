"use client";

import {
  useLayoutEffect,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface UseTableHeightOptions {
  minHeight?: number;
  bottomOffset?: number;
  headerHeight?: number;
  rowHeight?: number;
}

interface UseTableHeightResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  height: number;
  itemsPerPage: number;
}

// Default height to use before measurement - calculated to show ~16 skeleton rows
// 16 rows * 40px row height + 50px header = 690px
const DEFAULT_INITIAL_HEIGHT = 690;

export const useTableHeight = ({
  minHeight = 300,
  bottomOffset = 100,
  headerHeight = 50,
  rowHeight = 40,
}: UseTableHeightOptions = {}): UseTableHeightResult => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(DEFAULT_INITIAL_HEIGHT);

  const calculateHeight = useCallback(() => {
    const container = containerRef.current;
    if (!container) return DEFAULT_INITIAL_HEIGHT;

    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const availableHeight = viewportHeight - rect.top - bottomOffset;

    return Math.max(availableHeight, minHeight);
  }, [minHeight, bottomOffset]);

  useIsomorphicLayoutEffect(() => {
    const updateHeight = () => {
      const newHeight = calculateHeight();
      setHeight(newHeight);
    };

    updateHeight();

    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, [calculateHeight]);

  const itemsPerPage = Math.max(
    Math.floor((height - headerHeight) / rowHeight),
    5,
  );

  return {
    containerRef,
    height,
    itemsPerPage,
  };
};
