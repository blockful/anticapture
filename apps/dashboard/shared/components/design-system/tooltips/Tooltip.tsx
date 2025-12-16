"use client";

import { Content, Trigger, Root } from "@radix-ui/react-tooltip";
import { cn } from "@/shared/utils/";
import { ReactNode, useState } from "react";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
interface TooltipProps {
  children: ReactNode;
  tooltipContent: ReactNode;
  className?: string;
  title?: ReactNode;
}

export function Tooltip({
  children,
  tooltipContent,
  className,
  title,
}: TooltipProps) {
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
          "tooltip-content-animate bg-surface-contrast border-border-contrast text-primary font-inter z-50 flex max-w-[380px] flex-col overflow-hidden rounded-md border px-3 py-1.5 text-center text-sm font-normal not-italic leading-5 shadow-md",
          title ? "text-secondary text-left" : "text-primary",
          className,
        )}
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={true}
      >
        {title && (
          <div className="text-primary flex w-full items-center justify-start gap-2 whitespace-nowrap text-start font-mono text-[13px] font-medium uppercase not-italic leading-5 tracking-[0.78px]">
            {title}
          </div>
        )}
        {title && <DividerDefault className="bg-border-contrast my-2" />}
        {tooltipContent}
      </Content>
    </Root>
  );
}
