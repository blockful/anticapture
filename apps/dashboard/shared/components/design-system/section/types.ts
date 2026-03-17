import type { ReactNode } from "react";

export type SectionTitleProps = {
  icon: ReactNode;
  title: string;
  riskLevel?: ReactNode;
  description: string;
};

export type SubsectionTitleProps = {
  subsectionTitle: string | ReactNode;
  subsectionDescription: string;
  dateRange: string;
  switcherComponent: ReactNode;
};

export type SubSectionProps = {
  subsectionTitle: string | ReactNode;
  subsectionDescription?: string;
  dateRange: string;
  switcherComponent?: ReactNode;
  children: ReactNode;
  className?: string;
};

export type SubSectionsContainerProps = {
  children: ReactNode;
  className?: string;
};

export type BulletDividerProps = {
  className?: string;
};
