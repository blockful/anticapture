import { DaoIdEnum } from "@/shared/types/daos";
import { ComponentProps } from "react";

export interface DaoAvatarIconProps extends ComponentProps<"svg"> {
    daoId: DaoIdEnum;
    isRounded?: boolean;
    showBackground?: boolean;
  }
  
  export type AvatarIconProps = Omit<DaoAvatarIconProps, "daoId">;
  
  export interface DaoIconProps extends ComponentProps<"svg"> {
    showBackground?: boolean;
  }