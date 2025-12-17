"use client";

import { Content, Trigger, Root, Portal } from "@radix-ui/react-tooltip";
import { cn } from "@/shared/utils/";
import { ReactNode, useState } from "react";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { useScreenSize } from "@/shared/hooks/useScreenSize";

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
  const { isMobile } = useScreenSize();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  // On mobile, prevent default behavior and manually control open state
  const onClick = isMobile
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }
    : undefined;

  return (
    <Root
      open={open}
      delayDuration={300}
      onOpenChange={handleOpenChange}
      disableHoverableContent
    >
      <Trigger role="button" aria-label="tooltip-info" onClick={onClick}>
        {children}
      </Trigger>
      <Portal>
        <Content
          data-slot="tooltip-content"
          className={cn(
            "tooltip-content-animate bg-surface-contrast border-border-contrast text-primary font-inter flex max-w-[380px] flex-col overflow-hidden rounded-md border px-3 py-1.5 text-center text-sm font-normal not-italic leading-5 shadow-md",
            title ? "text-secondary text-left" : "text-primary",
            className,
          )}
          side="top"
          align="center"
          sideOffset={10}
          avoidCollisions={true}
          style={{
            zIndex: 9999,
            // Safari mobile fix: ensure tooltip creates its own stacking context
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)",
          }}
        >
          {title && (
            <div className="text-primary flex w-full items-center justify-start gap-2 whitespace-nowrap text-start font-mono text-[13px] font-medium uppercase not-italic leading-5 tracking-[0.78px]">
              {title}
            </div>
          )}
          {title && <DividerDefault className="bg-border-contrast my-2" />}
          {tooltipContent}
        </Content>
      </Portal>
    </Root>
  );
}
