"use client";

import { cn } from "@/shared/utils";
import daoConfig from "@/shared/dao-config";
import { DaoAvatarIconProps } from "@/shared/components/icons/types";
export const DaoAvatarIcon = ({
  daoId,
  isRounded = false,
  showBackground = true,
  ...props
}: DaoAvatarIconProps) => {
  const className = cn(
    isRounded ? "rounded-full" : "rounded-md",
    props.className,
  );
  const DaoIcon = daoConfig[daoId].icon;
  if (!DaoIcon) return null;
  return (
    <DaoIcon {...props} className={className} showBackground={showBackground} />
  );
};
