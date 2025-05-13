"use client";

import { ComponentProps } from "react";
import { DaoIdEnum } from "@/lib/types/daos";
import { cn } from "@/lib/client/utils";
import daoConfig from "@/lib/dao-config";

export interface DaoAvatarIconProps extends ComponentProps<"svg"> {
  daoId: DaoIdEnum;
  isRounded?: boolean;
  showBackground?: boolean;
}

export type AvatarIconProps = Omit<DaoAvatarIconProps, "daoId">;

export interface DaoIconProps extends ComponentProps<"svg"> {
  showBackground?: boolean;
}

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
