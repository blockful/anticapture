"use client";

import { getDateRange } from "@/shared/utils";
import { ReactNode } from "react";
import { cn } from "@/shared/utils";
import { SectionTitle } from "@/shared/components/design-system/section/SectionTitle";
import { SubSection } from "@/shared/components/design-system/section";

interface TheSectionLayoutProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  infoText?: string;
  days?: string;
  switchDate?: ReactNode;
  isSwitchDateLinear?: boolean;
  riskLevel?: ReactNode;
  children: ReactNode;
  className?: string;
  subHeader?: ReactNode;
  leftContent?: ReactNode;
  subsectionTitle?: string;
  subsectionDescription?: string;
}

export const TheSectionLayout = ({
  icon,
  title,
  description,
  days,
  riskLevel,
  children,
  className,
  subsectionTitle,
  subsectionDescription,
}: TheSectionLayoutProps) => {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-8 border-b-2 border-b-white/10 px-4 sm:gap-6 sm:border-none sm:p-5",
        className,
      )}
    >
      <SectionTitle
        icon={icon}
        title={title}
        riskLevel={riskLevel}
        description={description ?? ""}
      />
      {subsectionTitle ? (
        <SubSection
          subsectionTitle={subsectionTitle}
          subsectionDescription={subsectionDescription ?? ""}
          dateRange={getDateRange(days ?? "")}
        >
          {children}
        </SubSection>
      ) : (
        children
      )}
    </div>
  );
};
