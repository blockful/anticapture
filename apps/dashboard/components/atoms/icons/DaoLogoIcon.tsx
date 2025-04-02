import { SVGProps } from "react";
import { EnsIcon, OptimismIcon, UniswapIcon } from "@/components/atoms";
import { DaoIdEnum } from "@/lib/types/daos";

export enum DaoLogoVariant {
  DEFAULT = "default",
  SECONDARY = "secondary",
}

interface DaoLogoIconProps extends SVGProps<SVGSVGElement> {
  daoId: DaoIdEnum;
  variant?: DaoLogoVariant;
}

export const DaoLogoIcon = ({
  daoId,
  variant = DaoLogoVariant.DEFAULT,
  ...props
}: DaoLogoIconProps) => {
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
