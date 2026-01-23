"use client";

import React from "react";
import { cn } from "@/shared/utils";

interface TextIconLeftProps {
  text: string;
  icon?: React.ReactNode;
  className?: string;
}

export const TextIconLeft = ({ text, icon, className }: TextIconLeftProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      <span className="text-secondary whitespace-nowrap text-sm font-normal">
        {text}
      </span>
    </div>
  );
};
