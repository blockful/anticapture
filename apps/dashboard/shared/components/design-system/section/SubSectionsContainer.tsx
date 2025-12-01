"use client";

import { cn } from "@/shared/utils";
import { ReactNode } from "react";

type SubSectionsContainerProps = {
  children: ReactNode;
  className?: string;
};

export const SubSectionsContainer = ({
  children,
  className = "",
}: SubSectionsContainerProps) => {
  return (
    <div
      className={cn(
        "sm:bg-surface-default flex h-full flex-col gap-6 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
};
