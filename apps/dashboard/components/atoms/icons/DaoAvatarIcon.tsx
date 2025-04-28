"use client";

import { SVGProps } from "react";
import { EnsIcon, OptimismIcon, UniswapIcon } from "@/components/atoms";
import { DaoIdEnum } from "@/lib/types/daos";

export enum DaoAvatarVariant {
  DEFAULT = "default",
  SECONDARY = "secondary",
}

export enum DaoAvatarSize {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  XLARGE = "xlarge",
}

interface DaoAvatarIconProps extends SVGProps<SVGSVGElement> {
  daoId: DaoIdEnum;
  variant?: DaoAvatarVariant;
  size?: DaoAvatarSize;
}

export const DaoAvatarIcon = ({
  daoId,
  variant = DaoAvatarVariant.DEFAULT,
  size = DaoAvatarSize.MEDIUM,
  ...props
}: DaoAvatarIconProps) => {
  switch (daoId) {
    case DaoIdEnum.UNISWAP:
      return <UniswapIcon {...props} variant={variant} />;
    case DaoIdEnum.ENS:
      return <EnsIcon {...props} variant={variant} />;
    case DaoIdEnum.OPTIMISM:
      return <OptimismIcon {...props} variant={variant} />;
    default:
      return null;
  }
};
