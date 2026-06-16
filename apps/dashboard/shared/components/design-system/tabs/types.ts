import type { ReactNode } from "react";

export type TabSize = "sm" | "md";

export type TabVariant = "underline" | "button";

export type TabItem = {
  label: ReactNode;
  value: string;
  badge?: string | number;
};

export type TabProps = {
  label: ReactNode;
  isActive?: boolean;
  size?: TabSize;
  variant?: TabVariant;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
};

export type TabGroupProps = {
  tabs: TabItem[];
  activeTab?: string;
  size?: TabSize;
  variant?: TabVariant;
  onTabChange?: (value: string) => void;
  className?: string;
};

// ---------------------------------------------------------------------------
// Pill tabs
// ---------------------------------------------------------------------------

export type PillTabCounter = {
  /** e.g. "9.1K" */
  voters: string;
  /** e.g. "1.2M VP" */
  vp: string;
  /** e.g. "76%" */
  percentage: string;
};

export type PillTabProps = {
  label: ReactNode;
  isActive?: boolean;
  counter?: PillTabCounter;
  onClick?: () => void;
  className?: string;
};

export type PillTabGroupProps = {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  className?: string;
};
