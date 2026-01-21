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
  headerAction?: ReactNode;
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
  headerAction,
}: TheSectionLayoutProps) => {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-8 border-none px-4 py-5 sm:gap-6 sm:p-5",
        className,
      )}
    >
      <div className="flex w-full items-start justify-between gap-4">
        <SectionTitle
          icon={icon}
          title={title}
          riskLevel={riskLevel}
          description={description ?? ""}
        />
        {headerAction}
      </div>
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
