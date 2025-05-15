"use client";

import { ReactNode } from "react";
import { Badge } from "@/shared/components";

interface BadgeItemProps {
  label?: string;
  icon?: ReactNode;
  className?: string;
}

export const BadgeCardDaoInfoItem = ({
  label,
  icon,
  className,
}: BadgeItemProps) => {
  return (
    <Badge className={`flex h-full w-full ${className}`}>
      <div className="flex">{icon}</div>
      <p className="flex whitespace-nowrap text-sm font-normal text-white">
        {label}
      </p>
    </Badge>
  );
};
