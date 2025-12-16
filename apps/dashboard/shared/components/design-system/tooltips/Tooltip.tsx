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
      delayDuration={0}
      onOpenChange={handleOpenChange}
      disableHoverableContent
    >
      <Trigger role="button" aria-label="tooltip-info" onClick={handleToggle}>
        {children}
      </Trigger>
      <Content
        data-slot="tooltip-content"
        className={cn(
          "bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md",
          "bg-surface-contrast border-border-contrast text-primary max-w-[350px] border-pink-300",
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
