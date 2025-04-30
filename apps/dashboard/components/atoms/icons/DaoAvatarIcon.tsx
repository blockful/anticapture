"use client";

import { SVGProps } from "react";
import { DaoIdEnum } from "@/lib/types/daos";
import { cn } from "@/lib/client/utils";
import {
  ArbitrumIcon,
  EnsIcon,
  OptimismIcon,
  UniswapIcon,
} from "@/components/atoms/icons";

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
  const className = cn(isRounded ? "rounded-full" : "rounded-md", size);

  switch (daoId) {
    case DaoIdEnum.UNISWAP:
      return (
        <UniswapIcon
          {...props}
          className={className}
          showBackground={showBackground}
        />
      );

    case DaoIdEnum.ENS:
      return (
        <EnsIcon
          {...props}
          className={className}
          showBackground={showBackground}
        />
      );
    case DaoIdEnum.ARBITRUM:
      return (
        <ArbitrumIcon
          {...props}
          className={className}
          showBackground={showBackground}
        />
      );
    case DaoIdEnum.OPTIMISM:
      return (
        <OptimismIcon
          {...props}
          className={className}
          showBackground={showBackground}
        />
      );
    default:
      return null;
  }
};
