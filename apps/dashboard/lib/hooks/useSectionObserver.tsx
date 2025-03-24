"use client";

import { useEffect, useState, useRef } from "react";

interface UseSectionObserverProps {
  initialSection?: string;
  headerOffset: number | null;
}

export const useSectionObserver = ({
  initialSection,
  headerOffset = null,
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

    const section = document.getElementById(sectionId);
    if (headerOffset && section) {
      const sectionRect = section.getBoundingClientRect();
      const offsetPosition = sectionRect.top + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    setTimeout(() => {
      isScrollingRef.current = false;
      hasScrolledRef.current = true;
    }, 500);
  };

  return { activeSection, handleSectionClick };
};
