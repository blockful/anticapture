"use client";

import { Content, Trigger, Root, Portal } from "@radix-ui/react-tooltip";
import { ReactNode, useState } from "react";

import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { useScreenSize } from "@/shared/hooks/useScreenSize";
import { cn } from "@/shared/utils/";

interface TooltipProps {
  children: ReactNode;
  tooltipContent: ReactNode;
  className?: string;
  triggerClassName?: string;
  title?: ReactNode;
  titleRight?: ReactNode;
  asChild?: boolean;
  disableMobileClick?: boolean;
}

export function Tooltip({
  children,
  tooltipContent,
  className,
  triggerClassName,
  title,
  titleRight,
  asChild = false,
  disableMobileClick = false,
}: TooltipProps) {
  const [open, setOpen] = useState<boolean>(false);
  const { isMobile } = useScreenSize();

  const handleOpenChange = (nextOpen: boolean) => {
    if (isMobile && disableMobileClick) return;
    setOpen(nextOpen);
  };

  const onClick =
    isMobile && !disableMobileClick
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
      <Trigger
        asChild={asChild}
        role="button"
        aria-label="tooltip-info"
        className={triggerClassName}
        onClick={onClick}
      >
        {children}
      </Trigger>
      <Portal>
        <Content
          data-slot="tooltip-content"
          className={cn(
            "tooltip-content-animate bg-surface-contrast border-border-contrast text-primary font-inter flex max-w-[384px] flex-col overflow-hidden border px-3 py-1.5 text-center text-sm font-normal not-italic leading-5 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]",
            title ? "text-secondary text-left" : "text-primary",
            className,
          )}
          side="top"
          align="center"
          sideOffset={5}
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
              {titleRight && (
                <>
                  <div className="bg-secondary/20 h-1 w-1 shrink-0 rounded-full" />
                  {titleRight}
                </>
              )}
            </div>
          )}
          {title && <DividerDefault className="bg-border-contrast my-2" />}
          {tooltipContent}
        </Content>
      </Portal>
    </Root>
  );
}
