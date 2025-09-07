"use client";

import { ReactNode } from "react";
import { SubsectionTitle } from "@/shared/components/design-system/section/SubsectionTitle";

type SubSectionProps = {
  subsectionTitle: string;
  subsectionDescription?: string;
  dateRange: string;
  children: ReactNode;
  className?: string;
};

export const SubSection = ({
  subsectionTitle,
  subsectionDescription,
  dateRange,
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
        />
      </div>
      <div>{children}</div>
    </>
  );
};
