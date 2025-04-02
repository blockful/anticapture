"use client";

import { cn } from "@/lib/client/utils";
import {
  Badge,
  CircleCheckIcon,
  CircleNotCheckedIcon,
} from "@/components/atoms";
import { ReactNode } from "react";

interface SwitchItemProps {
  switched?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}

export const SwitchCardDaoInfoItem = (item: SwitchItemProps) => {
  return (
    <Badge
      className={cn(
        "!sm:bg-lightDark flex h-full w-full !gap-1.5 !bg-dark bg-opacity-20 !px-2.5 !py-1 lg:w-fit",
        item.onClick &&
          "!cursor-pointer transition-all duration-300 hover:!bg-middleDark",
      )}
      onClick={item.onClick}
    >
      {item.switched ? (
        <CircleCheckIcon className="text-green-400" />
      ) : (
        <CircleNotCheckedIcon className="text-red-400" />
      )}
      <p
        className={cn([
          "text-sm font-medium leading-tight",
          item.switched ? "text-green-400" : "text-red-400",
        ])}
      >
        {item.switched ? "Yes" : "No"}
      </p>
      <span> {item.icon}</span>
    </Badge>
  );
};
