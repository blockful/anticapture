export type TabSize = "sm" | "md";

export type TabItem = {
  label: string;
  value: string;
  badge?: string | number;
};

export type TabProps = {
  label: string;
  isActive?: boolean;
  size?: TabSize;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
};

export type TabGroupProps = {
  tabs: TabItem[];
  activeTab?: string;
  size?: TabSize;
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
  label: string;
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
