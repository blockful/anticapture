import { ComponentProps } from "react";

import { DaoIdEnum } from "@/shared/types/daos";

export interface DaoAvatarIconProps extends ComponentProps<"svg"> {
  daoId: DaoIdEnum;
  isRounded?: boolean;
  showBackground?: boolean;
}

export type AvatarIconProps = Omit<DaoAvatarIconProps, "daoId">;

export interface DaoIconProps extends ComponentProps<"svg"> {
  showBackground?: boolean;
}
