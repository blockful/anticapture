"use client";

import { cn } from "@/shared/utils/cn";

import type { SubSectionsContainerProps } from "@/shared/components/design-system/section/types";

export const SubSectionsContainer = ({
  children,
  className = "",
}: SubSectionsContainerProps) => {
  return (
    <div
      className={cn(
        "lg:bg-surface-default flex h-full flex-col gap-6 lg:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
};
