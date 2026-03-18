import type { ReactNode } from "react";

export type InlineAlertProps = {
  text: string;
  variant: "info" | "warning" | "error";
  className?: string;
};

export type BannerLink = {
  url: string;
  text: string;
  openInNewTab?: boolean;
};

export type BannerAlertProps = {
  icon: ReactNode;
  text: string;
  links?: BannerLink | BannerLink[];
  storageKey: string;
  variant?: "default" | "highlight";
  persist?: boolean;
  className?: string;
};
