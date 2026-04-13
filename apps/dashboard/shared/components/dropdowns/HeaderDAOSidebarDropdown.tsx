"use client";

import { ChevronsLeft, ChevronsRight, ChevronsUpDown } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { DaoAvatarIcon } from "@/shared/components/icons";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/";
import { getDaoNavigationPath } from "@/shared/utils/dao-navigation";

const ANIMATION_DURATION = 200;

type DropdownItem = {
  id: number;
  daoId: DaoIdEnum;
  label: string;
};

export interface HeaderDAOSidebarDropdownProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export const HeaderDAOSidebarDropdown = ({
  isCollapsed = false,
  onToggleCollapse,
  onOpenChange,
}: HeaderDAOSidebarDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { daoId } = useParams<{ daoId: string }>();

  const close = useCallback(() => {
    if (!isOpen) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosing(true);
    onOpenChange?.(false);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, ANIMATION_DURATION);
  }, [isOpen, onOpenChange]);

  const open = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosing(false);
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

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

  const dropdownItemsRef = useRef<DropdownItem[] | null>(null);
  if (!dropdownItemsRef.current) {
    dropdownItemsRef.current = Object.values(DaoIdEnum).map(
      (daoIdValue, index) => ({
        id: index,
        daoId: daoIdValue,
        label: daoConfigByDaoId[daoIdValue].name,
      }),
    );
  }
  const dropdownItems = dropdownItemsRef.current;

  const currentDaoId =
    daoId?.toUpperCase() ?? pathname.split("/")[1]?.toUpperCase();
  const currentItem = dropdownItems.find((item) => item.daoId === currentDaoId);

  const handleSelectItem = (id: number, targetDaoId: DaoIdEnum) => {
    sessionStorage.setItem("selectedHeaderSidebarItem", id.toString());
    close();
    router.push(
      getDaoNavigationPath({
        targetDaoId,
        pathname,
        currentDaoId: daoId,
      }),
    );
  };

  return (
    <div
      ref={ref}
      className="border-light-dark lg:h-16.25 relative z-50 inline-block h-14 w-full shrink-0 border-b"
      onMouseLeave={() => isOpen && close()}
    >
      <div className="flex h-full items-center">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="hover:bg-surface-contrast flex h-full flex-1 items-center justify-between overflow-hidden px-3 py-2 transition-colors"
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-2",
              isCollapsed && "w-full justify-center",
            )}
          >
            {currentItem && (
              <div className="shrink-0">
                <DaoAvatarIcon
                  daoId={currentItem.daoId}
                  className="size-8"
                  isRounded
                />
              </div>
            )}
            {!isCollapsed && (
              <p className="text-primary min-w-0 flex-1 truncate whitespace-nowrap text-left text-[18px] font-medium leading-6">
                {currentItem?.label}
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

      {(isOpen || isClosing) && (
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
          {dropdownItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => handleSelectItem(item.id, item.daoId)}
              className="text-primary hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm font-normal transition-colors"
            >
              <DaoAvatarIcon daoId={item.daoId} className="size-4" isRounded />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
