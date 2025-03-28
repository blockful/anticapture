"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";
import { Badge } from "@/components/atoms";
import { cn } from "@/lib/client/utils";

interface ButtonCardDaoInfoItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: ReactNode;
  inverted?: boolean;
}

export function ButtonCardDaoInfoItem({
  label,
  icon,
  inverted,
  className,
  ...props
}: ButtonCardDaoInfoItemProps) {
  return (
    <button className={`flex h-full w-full ${className ?? ""}`} {...props}>
      <Badge
        className={cn("flex h-full w-full gap-1", {
          "hover:border-lightDark hover:bg-transparent": !props.disabled,
        })}
      >
        {inverted ? (
          <>
            <p className="text-sm font-medium leading-tight">{label}</p>
            {icon}
          </>
        ) : (
          <>
            {icon}
            <p className="text-sm font-medium leading-tight">{label}</p>
          </>
        )}
      </Badge>
    </button>
  );
}
