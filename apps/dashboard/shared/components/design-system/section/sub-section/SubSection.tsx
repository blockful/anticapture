"use client";

import { SubsectionTitle } from "@/shared/components/design-system/section/subsection-title/SubsectionTitle";

import type { SubSectionProps } from "@/shared/components/design-system/section/types";

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
