"use client";

import { ReactNode } from "react";
import { SubsectionTitle } from "@/shared/components/design-system/section/SubsectionTitle";

type SubSectionProps = {
  subsectionTitle: string;
  subsectionDescription?: string;
  dateRange: string;
  switcherComponent?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const SubSection = ({
  subsectionTitle,
  subsectionDescription,
  dateRange,
  switcherComponent,
  children,
  className = "",
}: SubSectionProps) => {
  return (
    <>
      <div className={className}>
        <SubsectionTitle
          subsectionTitle={subsectionTitle}
          subsectionDescription={subsectionDescription ?? ""}
          dateRange={dateRange}
          switcherComponent={switcherComponent}
        />
      </div>
      <div>{children}</div>
    </>
  );
};
