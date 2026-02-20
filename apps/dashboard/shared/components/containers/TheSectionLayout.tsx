import { getDateRange, cn } from "@/shared/utils";
import { ReactNode } from "react";
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
  headerAction?: ReactNode;
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
  headerAction,
  subsectionTitle,
  subsectionDescription,
}: TheSectionLayoutProps) => {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-8 border-none px-4 py-5 lg:gap-6 lg:p-5",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-4",
          headerAction && "flex-col lg:flex-row",
        )}
      >
        <SectionTitle
          icon={icon}
          title={title}
          riskLevel={riskLevel}
          description={description ?? ""}
        />
        {headerAction}
      </div>
      <div className="border-border-default w-full border-b border-dashed lg:hidden" />
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
