"use client";

import { useEffect, useRef } from "react";
import { useDaoPageInteraction } from "@/shared/contexts/DaoPageInteractionContext";

interface UseSectionObserverProps {
  initialSection?: string;
  headerOffset?: number;
  useWindowScrollTo?: boolean;
}

export const useSectionObserver = ({
  headerOffset = 0,
  useWindowScrollTo = false,
}: UseSectionObserverProps) => {
  const { activeSection, updateActiveSection } = useDaoPageInteraction();
  const hasScrolledRef = useRef<boolean>(false);

  useEffect(() => {
    const handleSectionChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      updateActiveSection(customEvent.detail, { source: "event" });
    };

    window.addEventListener("sectionInView", handleSectionChange);
    return () => {
      window.removeEventListener("sectionInView", handleSectionChange);
    };
  }, [updateActiveSection]);

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
    updateActiveSection(sectionId, { source: "programmatic" });

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
      updateActiveSection(activeSection, { source: "programmatic", end: true });
      hasScrolledRef.current = true;
    }, 1000);
  };

  return { activeSection, handleSectionClick };
};
