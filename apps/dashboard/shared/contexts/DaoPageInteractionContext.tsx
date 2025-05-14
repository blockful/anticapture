"use client";

import { createContext, useState, useContext } from "react";
import { SECTIONS_CONSTANTS } from "@/shared/constants/lib-constants";

interface DaoPageInteractionContextType {
  activeRisk: string;
  setActiveRisk: (riskName: string) => void;
  scrollToSection: (anchorId: string) => void;
}

const DaoPageInteractionContext = createContext<DaoPageInteractionContextType>({
  activeRisk: "",
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
  const [activeRisk, setActiveRisk] = useState("SPAM VULNERABLE");

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
