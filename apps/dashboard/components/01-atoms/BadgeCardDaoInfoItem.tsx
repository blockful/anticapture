import { ReactNode } from "react";
import { Badge } from "./Badge";

interface BadgeItemProps {
  label?: string;
  icon?: ReactNode;
}

export const BadgeCardDaoInfoItem = (item: BadgeItemProps) => {
  return (
    <Badge className="flex h-full w-full">
      <div className="flex">{item.icon}</div>
      <p className="flex whitespace-nowrap text-sm font-medium leading-tight">
        {item.label}
      </p>
    </Badge>
  );
};
