"use client";

import { X } from "lucide-react";

import { IconButton } from "@/shared/components";
import type { DrawerCloseButtonProps } from "@/shared/components/design-system/drawer/types";

export const DrawerCloseButton = ({ onClick }: DrawerCloseButtonProps) => {
  return <IconButton variant="outline" size="sm" onClick={onClick} icon={X} />;
};
