"use client";

import { useEffect, useState, useRef } from "react";

interface UseSectionObserverProps {
  initialSection?: string;
  headerOffset?: number;
  useWindowScrollTo?: boolean;
}

export const useSectionObserver = ({
  initialSection,
  headerOffset = 0,
  useWindowScrollTo = false,
}: UseSectionObserverProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(
    initialSection ?? null,
  );
  const isScrollingRef = useRef<boolean>(false);
  const hasScrolledRef = useRef<boolean>(false);

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

    const section = document.getElementById(sectionId);
    if (section) {
      if (useWindowScrollTo && headerOffset > 0) {
        const sectionTop = section.getBoundingClientRect().top;
        const offsetPosition = window.scrollY + sectionTop - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });
      } else {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }

    setTimeout(() => {
      isScrollingRef.current = false;
      hasScrolledRef.current = true;
    }, 500);
  };

  return { activeSection, handleSectionClick };
};
