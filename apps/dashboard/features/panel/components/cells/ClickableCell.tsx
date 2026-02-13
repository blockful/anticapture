"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/utils";

interface ClickableCellProps {
  href?: string;
  children: ReactNode;
  className?: string;
}

export const ClickableCell = ({
  href,
  children,
  className,
}: ClickableCellProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "flex w-full items-center transition-colors duration-200",
        href && "cursor-pointer",
        href && isHovered && "bg-surface-contrast",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={href ? () => router.push(href) : undefined}
    >
      {children}
    </div>
  );
};
