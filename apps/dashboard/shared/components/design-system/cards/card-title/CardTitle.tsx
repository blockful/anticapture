import { CheckCircle2 } from "lucide-react";

import { cn } from "@/shared/utils/cn";

import type { CardTitleProps } from "@/shared/components/design-system/cards/types";

export const CardTitle = ({
  text,
  isSmall = false,
  hasIcon = false,
  avatar,
  badge,
  className,
}: CardTitleProps) => {
  return (
    <div
      className={cn(
        "text-primary flex w-full items-center",
        isSmall ? "gap-1.5" : "gap-2",
        className,
      )}
    >
      {hasIcon && <CheckCircle2 className="text-secondary size-4 shrink-0" />}
      {avatar}
      <span
        className={cn(
          "flex-1 font-medium",
          isSmall ? "text-body-md" : "text-h5",
        )}
      >
        {text}
      </span>
      {badge}
    </div>
  );
};
