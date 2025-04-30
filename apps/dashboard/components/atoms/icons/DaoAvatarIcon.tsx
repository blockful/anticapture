"use client";

import { SVGProps } from "react";
import { DaoIdEnum } from "@/lib/types/daos";
import { cn } from "@/lib/client/utils";
import { UniswapIcon } from "@/components/atoms/icons/UniswapIcon";

export enum DaoAvatarSize {
  XSMALL = "size-[16px]",
  SMALL = "size-[24px]",
  MEDIUM = "size-[36px]",
  LARGE = "size-[48px]",
  XLARGE = "size-[76px]",
}

export interface DaoAvatarIconProps extends SVGProps<SVGSVGElement> {
  daoId: DaoIdEnum;
  isRounded?: boolean;
  size?: DaoAvatarSize;
  showBackground?: boolean;
}

export type AvatarIconProps = Omit<DaoAvatarIconProps, "daoId">;

export const DaoAvatarIcon = ({
  daoId,
  isRounded = false,
  size = DaoAvatarSize.MEDIUM,
  showBackground = true,
  ...props
}: DaoAvatarIconProps) => {
  switch (daoId) {
    case DaoIdEnum.UNISWAP:
      return (
        <UniswapIcon
          {...props}
          className={cn(isRounded ? "rounded-full" : "rounded-md", size)}
          showBackground={showBackground}
        />
      );

    // case DaoIdEnum.ENS:
    //   return <EnsIcon {...props} isRounded={isRounded} size={size} />;
    // case DaoIdEnum.OPTIMISM:
    //   return <OptimismIcon {...props} isRounded={isRounded} size={size} />;
    // default:
    //   return null;
  }
};
