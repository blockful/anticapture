"use client";

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
      className={`sm:bg-surface-default sm:p-5 ${className} flex h-full flex-col gap-6`}
    >
      {children}
    </div>
  );
};
