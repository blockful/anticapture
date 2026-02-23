"use client";

import { ReactNode } from "react";

import { cn } from "@/shared/utils";

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
        "lg:bg-surface-default flex h-full flex-col gap-6 lg:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
};
