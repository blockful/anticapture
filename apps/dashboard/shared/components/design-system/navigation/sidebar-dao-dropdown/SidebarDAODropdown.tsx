"use client";

import { ChevronsLeft, ChevronsRight, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/utils/cn";

const ANIMATION_DURATION = 200;

export type SidebarDAODropdownProps = {
  label: string;
  avatar: ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  children?: ReactNode;
  className?: string;
};

export const SidebarDAODropdown = ({
  label,
  avatar,
  isCollapsed = false,
  onToggleCollapse,
  children,
  className,
}: SidebarDAODropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (!isOpen) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, ANIMATION_DURATION);
  }, [isOpen]);

  const open = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen && !isClosing) {
      close();
    } else {
      open();
    }
  }, [isOpen, isClosing, close, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [close]);

  return (
    <div
      ref={ref}
      className={cn(
        "border-light-dark relative z-50 inline-block h-[65px] w-full shrink-0 border-b",
        className,
      )}
      onMouseLeave={() => isOpen && close()}
    >
      <div className="flex h-full items-center px-3 py-2">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="flex flex-1 items-center justify-between overflow-hidden transition-all"
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-2",
              isCollapsed && "w-full justify-center",
            )}
          >
            <div className="shrink-0">{avatar}</div>
            {!isCollapsed && (
              <p className="text-primary min-w-0 flex-1 truncate whitespace-nowrap text-left text-[18px] font-medium leading-6">
                {label}
              </p>
            )}
          </div>
          {!isCollapsed && (
            <div className="shrink-0">
              <ChevronsUpDown className="text-secondary size-5 transition-all duration-300" />
            </div>
          )}
        </button>
      </div>

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="bg-surface-default border-light-dark hover:bg-surface-contrast absolute right-0 top-1/2 z-50 -translate-y-1/2 translate-x-[65%] cursor-pointer border p-1 transition-colors"
        >
          {isCollapsed ? (
            <ChevronsRight className="text-primary size-[14px]" />
          ) : (
            <ChevronsLeft className="text-primary size-[14px]" />
          )}
        </button>
      )}

      {(isOpen || isClosing) && children && (
        <div
          role="menu"
          className={cn(
            "border-light-dark bg-surface-default absolute z-50 flex flex-col border shadow-lg",
            isCollapsed ? "left-0 top-full w-[200px]" : "left-0 right-0",
            isClosing
              ? "animate-fade-out [animation-duration:200ms]"
              : "animate-fade-in [animation-duration:200ms]",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};
