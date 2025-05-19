"use client";

import { createContext, useState, useContext } from "react";
import { RiskAreaEnum } from "@/shared/types/enums/RiskArea";

interface DaoPageInteractionContextType {
  activeRisk: RiskAreaEnum;
  setActiveRisk: (risk: RiskAreaEnum) => void;
  scrollToSection: (anchorId: string) => void;
}

const DaoPageInteractionContext = createContext<DaoPageInteractionContextType>({
  activeRisk: RiskAreaEnum.SPAM_VULNERABLE,
  setActiveRisk: () => {},
  scrollToSection: () => {},
});

export const useDaoPageInteraction = () =>
  useContext(DaoPageInteractionContext);

export const DaoPageInteractionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeRisk, setActiveRisk] = useState<RiskAreaEnum>(
    RiskAreaEnum.SPAM_VULNERABLE,
  );

  const scrollToSection = (anchorId: string) => {
    // Scroll to the specified section
    const section = document.getElementById(anchorId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <DaoPageInteractionContext.Provider
      value={{ activeRisk, setActiveRisk, scrollToSection }}
    >
      {children}
    </DaoPageInteractionContext.Provider>
  );
};

export default DaoPageInteractionContext;
