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
    <div className={`bg-surface-default rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
};
