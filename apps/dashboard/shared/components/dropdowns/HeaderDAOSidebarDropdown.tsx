"use client";

import { ChevronsUpDown, ChevronsRight, ChevronsLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useRef, useEffect, useCallback } from "react";

import { Button } from "@/shared/components";
import { DaoAvatarIcon } from "@/shared/components/icons";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/";

type Item = {
  id: number;
  label: string;
  icon: React.ReactNode;
  href: string;
  name: string;
};

interface HeaderDAOSidebarDropdownProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const HeaderDAOSidebarDropdown = ({
  isCollapsed = false,
  onToggleCollapse,
}: HeaderDAOSidebarDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedHeaderSidebarItem, setSelectedHeaderSidebarItem] =
    useState<number>(0);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { daoId } = useParams<{ daoId: string }>();

  // restore selected item on mount
  useEffect(() => {
    const savedItem = sessionStorage.getItem("selectedHeaderSidebarItem");
    if (savedItem) {
      setSelectedHeaderSidebarItem(Number(savedItem));
    }
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // stable, single-build dropdown items (imports are static)
  const dropdownItemsRef = useRef<Item[] | null>(null);
  if (!dropdownItemsRef.current) {
    dropdownItemsRef.current = Object.values(DaoIdEnum).map(
      (daoIdValue, index) => ({
        id: index,
        label: daoConfigByDaoId[daoIdValue].name,
        icon: (
          <DaoAvatarIcon
            daoId={daoIdValue}
            className="size-icon-md"
            isRounded
          />
        ),
        href: `/${daoIdValue.toLowerCase()}`,
        name: daoIdValue,
      }),
    );
  }
  const dropdownItems = dropdownItemsRef.current!;

  const currentItem = dropdownItems.find(
    (item) => item.name === daoId.toUpperCase(),
  );

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleSelectItem = (id: number, href: string) => {
    setSelectedHeaderSidebarItem(id);
    sessionStorage.setItem("selectedHeaderSidebarItem", id.toString());
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div
      className="border-light-dark relative z-50 inline-block h-[57px] w-full shrink-0 border-b lg:h-[65px]"
      ref={dropdownRef}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex h-full items-center px-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-1 items-center justify-between overflow-hidden rounded-none transition-all"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="shrink-0">{currentItem?.icon}</div>
            {!isCollapsed && (
              <p className="text-primary truncate whitespace-nowrap text-[18px] font-medium leading-6">
                {currentItem?.label}
              </p>
            )}
          </div>
          {!isCollapsed && (
            <div className="shrink-0">
              <ChevronsUpDown className="text-secondary size-5 transition-all duration-300" />
            </div>
          )}
        </Button>
      </div>
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="bg-surface-default border-light-dark hover:bg-surface-contrast absolute right-0 top-1/2 z-50 -translate-y-1/2 translate-x-[65%] cursor-pointer border p-1 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronsRight className="text-primary size-[14px]" />
          ) : (
            <ChevronsLeft className="text-primary size-[14px]" />
          )}
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            "border-light-dark bg-surface-default absolute z-50 rounded-lg border shadow-lg transition-all duration-200 ease-in-out",
            isCollapsed
              ? "left-0 top-full w-[200px]"
              : "left-0 right-0 mx-4 w-auto lg:mx-0",
          )}
          role="menu"
        >
          {dropdownItems.map((item) => (
            <Button
              variant="ghost"
              size="lg"
              key={item.id}
              className={"w-full"}
              onClick={() => handleSelectItem(item.id, item.href || "")}
              role="menuitemradio"
              aria-checked={item.id === selectedHeaderSidebarItem}
            >
              <div className="flex w-full items-center gap-1.5 lg:gap-2">
                <DaoAvatarIcon
                  daoId={item.name as DaoIdEnum}
                  className={cn("size-icon-xxs lg:size-icon-sm")}
                  isRounded
                />
                <h1 className={cn("text-primary text-sm font-normal")}>
                  {item.label}
                </h1>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
