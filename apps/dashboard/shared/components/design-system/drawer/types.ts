import { ReactNode } from "react";

export interface DrawerRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export interface DrawerHeaderProps {
  subtitle?: string;
  title: string | ReactNode;
  onClose: () => void;
  tabs?: DrawerTabConfig[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export interface DrawerSubtitleProps {
  children: string;
}

export interface DrawerTitleProps {
  children: string | ReactNode;
}

export interface DrawerTabConfig {
  id: string;
  label: string;
  content: ReactNode;
}

export interface DrawerTabsProps {
  tabs: DrawerTabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export interface DrawerBodyProps {
  children: ReactNode;
  className?: string;
}

export interface DrawerCloseButtonProps {
  onClick: () => void;
}
