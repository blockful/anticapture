"use client";

import { X } from "lucide-react";

import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import type { DrawerCloseButtonProps } from "@/shared/components/design-system/drawer/types";

/** @internal Used internally by DrawerHeader. Not part of the public API. */
export const DrawerCloseButton = ({ onClick }: DrawerCloseButtonProps) => {
  return <IconButton variant="outline" size="sm" onClick={onClick} icon={X} />;
};
