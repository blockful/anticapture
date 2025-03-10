"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/atoms";

interface ButtonCardDaoInfoItemProps {
  label?: string;
  icon?: ReactNode;
  inverted?: boolean;
  onClick?: () => void;
}

export const ButtonCardDaoInfoItem = (item: ButtonCardDaoInfoItemProps) => {
  return (
    <button className="flex h-full w-full" onClick={item.onClick}>
      <Badge className="flex h-full w-full gap-1 hover:border-lightDark hover:bg-transparent">
        {item.inverted ? (
          <>
            <p className="text-sm font-medium leading-tight">{item.label}</p>
            {item.icon}
          </>
        ) : (
          <>
            {item.icon}
            <p className="text-sm font-medium leading-tight">{item.label}</p>
          </>
        )}
      </Badge>
    </button>
  );
};
