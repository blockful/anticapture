"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import type { DrawerRootProps } from "@/shared/components/design-system/drawer/types";
import { useScreenSize } from "@/shared/hooks";
import { cn } from "@/shared/utils";

const DrawerRoot = ({ open, onOpenChange, children }: DrawerRootProps) => {
  const { isMobile } = useScreenSize();

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
      data-slot="drawer"
    >
      {children}
    </DrawerPrimitive.Root>
  );
};

const DrawerPortal = ({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) => {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
};

const DrawerOverlay = ({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) => {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
};

const DrawerContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) => {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-surface-background fixed z-50 flex h-auto flex-col overflow-hidden",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:border-border-default data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:h-full data-[vaul-drawer-direction=bottom]:max-w-[800px] data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:border-border-default data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-[801px] data-[vaul-drawer-direction=right]:border-l",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:lg:max-w-sm",
          className,
        )}
        {...props}
      >
        <DrawerPrimitive.Title></DrawerPrimitive.Title>
        <div className="bg-surface-default flex h-full w-full flex-col overflow-hidden">
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
};

export { DrawerRoot, DrawerContent, DrawerPortal, DrawerOverlay };
