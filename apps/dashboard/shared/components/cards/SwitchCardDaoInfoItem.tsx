"use client";

import { cn } from "@/shared/utils/";
import { Badge } from "@/shared/components";
import { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface SwitchItemProps {
  switched?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}

export const SwitchCardDaoInfoItem = (item: SwitchItemProps) => {
  return (
    <Badge
      className={cn(
        "flex h-full w-full !gap-1.5 !bg-dark bg-opacity-20 !px-2.5 !py-1 sm:!bg-lightDark lg:w-fit",
        {
          "!cursor-pointer transition-all duration-300 hover:!bg-middleDark":
            item.onClick,
        },
      )}
      onClick={item.onClick}
    >
      {item.switched ? (
        <CheckCircle2 className="size-3.5 text-success" />
      ) : (
        <XCircle className="size-3.5 text-error" />
      )}
      <p
        className={cn([
          "text-sm font-medium leading-tight",
          item.switched ? "text-success" : "text-error",
        ])}
      >
        {item.switched ? "Yes" : "No"}
      </p>
      <span> {item.icon}</span>
    </Badge>
  );
};
