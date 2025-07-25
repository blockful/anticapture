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
        "!bg-surface-contrast/20 sm:bg-surface-contrast! flex h-full w-full gap-1.5! px-2.5! py-1! lg:w-fit",
        {
          "hover:bg-middle-dark! cursor-pointer! transition-all duration-300":
            item.onClick,
        },
      )}
      onClick={item.onClick}
    >
      {item.switched ? (
        <CheckCircle2 className="text-success size-3.5" />
      ) : (
        <XCircle className="text-error size-3.5" />
      )}
      <p
        className={cn([
          "text-sm leading-tight font-medium",
          item.switched ? "text-success" : "text-error",
        ])}
      >
        {item.switched ? "Yes" : "No"}
      </p>
      <span> {item.icon}</span>
    </Badge>
  );
};
