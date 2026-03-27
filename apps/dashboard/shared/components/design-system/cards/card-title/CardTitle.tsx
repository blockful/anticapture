import { cn } from "@/shared/utils/cn";

import type { CardTitleProps } from "@/shared/components/design-system/cards/types";

export const CardTitle = ({
  text,
  size = "default",
  icon,
  avatar,
  badge,
  className,
}: CardTitleProps) => {
  const isSmall = size === "small";

  return (
    <div
      className={cn(
        "text-primary flex w-full items-center",
        isSmall ? "gap-1.5" : "gap-2",
        className,
      )}
    >
      {icon}
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
