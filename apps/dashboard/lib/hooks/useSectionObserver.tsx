"use client";

import { useEffect, useState, useRef } from "react";

interface UseSectionObserverProps {
  initialSection?: string;
}

export const useSectionObserver = ({
  initialSection,
}: UseSectionObserverProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(
    initialSection ?? null,
  );
  const isScrollingRef = useRef(false);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    const handleSectionChange = (event: Event) => {
      if (isScrollingRef.current) return;
      const customEvent = event as CustomEvent<string>;
      setActiveSection(customEvent.detail);
    };

    window.addEventListener("sectionInView", handleSectionChange);
    return () => {
      window.removeEventListener("sectionInView", handleSectionChange);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolledRef.current) {
        hasScrolledRef.current = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSectionClick = (sectionId: string) => {
    isScrollingRef.current = true;
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setTimeout(() => {
      isScrollingRef.current = false;
      hasScrolledRef.current = true;
    }, 500);
  };

  return { activeSection, handleSectionClick };
};
