"use client";

import { ComponentProps } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/";
import {
  UniswapIcon,
  EnsIcon,
  ArbitrumIcon,
  OptimismIcon,
} from "@/shared/components/icons";

export interface DaoAvatarIconProps extends ComponentProps<"svg"> {
  daoId: DaoIdEnum;
  isRounded?: boolean;
  showBackground?: boolean;
}

export type AvatarIconProps = Omit<DaoAvatarIconProps, "daoId">;

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
