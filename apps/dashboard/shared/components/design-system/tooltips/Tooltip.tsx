"use client";

import { Content, Trigger, Root } from "@radix-ui/react-tooltip";
import { cn } from "@/shared/utils/";
import { ReactNode, useState } from "react";

export function Tooltip({
  children,
  tooltipContent,
  className,
}: {
  children: ReactNode;
  tooltipContent: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState<boolean>(false);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  return (
    <Root
      open={open}
      delayDuration={300}
      onOpenChange={handleOpenChange}
      disableHoverableContent
    >
      <Trigger role="button" aria-label="tooltip-info" onClick={handleToggle}>
        {children}
      </Trigger>
      <Content
        data-slot="tooltip-content"
        className={cn(
          "bg-popover text-popover-foreground z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md",
          "bg-surface-contrast border-border-contrast text-primary max-w-[350px]",
          className,
        )}
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={true}
      >
        {tooltipContent}
      </Content>
    </Root>
  );
}

// TooltipPlainStyles
// "border-light-dark bg-surface-default text-primary z-50 rounded-lg border p-3 text-center shadow-sm",
// "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
// "whitespace-normal break-words",
