"use client";

import { createContext, useState, useContext, ReactNode, useRef } from "react";
import { RiskAreaEnum } from "@/shared/types/enums/RiskArea";

interface DaoPageInteractionContextType {
  activeRisk: RiskAreaEnum;
  setActiveRisk: (risk: RiskAreaEnum) => void;
  scrollToSection: (anchorId: string) => void;
  activeSection: string | null;
  updateActiveSection: (
    section: string | null,
    options?: {
      source?: "programmatic" | "event";
      immediate?: boolean;
      end?: boolean;
    },
  ) => void;
}

const DaoPageInteractionContext = createContext<DaoPageInteractionContextType>({
  activeRisk: RiskAreaEnum.SPAM_VULNERABLE,
  setActiveRisk: () => {},
  scrollToSection: () => {},
  activeSection: null,
  updateActiveSection: () => {},
});

export const useDaoPageInteraction = () =>
  useContext(DaoPageInteractionContext);

export const DaoPageInteractionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [activeRisk, setActiveRisk] = useState<RiskAreaEnum>(
    RiskAreaEnum.SPAM_VULNERABLE,
  );
  const [activeSection, setActiveSectionState] = useState<string | null>(null);
  const isProgrammaticRef = useRef<boolean>(false);

  const updateActiveSection: DaoPageInteractionContextType["updateActiveSection"] =
    (section, options) => {
      const source = options?.source;
      const immediate = options?.immediate === true;
      const end = options?.end === true;

      if (source === "programmatic" && end) {
        isProgrammaticRef.current = false;
        return;
      }

      if (source === "programmatic") {
        isProgrammaticRef.current = true;
        setActiveSectionState(section);
        return;
      }

      if (immediate) {
        setActiveSectionState(section);
        return;
      }

      if (isProgrammaticRef.current) {
        return;
      }

      setActiveSectionState(section);
    };

  const scrollToSection = (anchorId: string) => {
    const section = document.getElementById(anchorId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <DaoPageInteractionContext.Provider
      value={{
        activeRisk,
        setActiveRisk,
        scrollToSection,
        activeSection,
        updateActiveSection,
      }}
    >
      {children}
    </DaoPageInteractionContext.Provider>
  );
};

export default DaoPageInteractionContext;
