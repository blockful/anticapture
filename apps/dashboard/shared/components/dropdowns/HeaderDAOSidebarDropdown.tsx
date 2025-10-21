/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { BadgeInAnalysis, Button } from "@/shared/components";
import { useParams, useRouter } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/utils/";
import { DaoAvatarIcon } from "@/shared/components/icons";
import daoConfigByDaoId from "@/shared/dao-config";
import { SupportStageEnum } from "@/shared/types/enums";

export const HeaderDAOSidebarDropdown = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedHeaderSidebarItem, setSelectedHeaderSidebarItem] =
    useState<number>(0);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { daoId } = useParams<{ daoId: string }>();

  useEffect(() => {
    const savedItem = sessionStorage.getItem("selectedHeaderSidebarItem");
    if (savedItem) {
      setSelectedHeaderSidebarItem(Number(savedItem));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dropdownItems = useMemo(
    () => [
      ...Object.values(DaoIdEnum)
        .filter((daoIdValue) => daoIdValue !== DaoIdEnum.SCR) // disable until Scroll is fully indexed on prod
        .map((daoIdValue, index) => ({
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
          isDisabled:
            daoConfigByDaoId[daoIdValue].supportStage ===
            SupportStageEnum.ANALYSIS,
        })),
    ],
    [],
  );

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
      className="border-light-dark relative z-50 inline-block h-[57px] w-full shrink-0 border-b sm:h-[65px]"
      ref={dropdownRef}
    >
      <div className="flex h-full items-center justify-between px-3.5 py-3.5 sm:p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <div className="flex w-full items-center gap-2">
            <div>{currentItem?.icon}</div>
            <p className="text-primary text-[18px] font-medium leading-6">
              {currentItem?.label}
            </p>
          </div>
          <div>
            <ChevronsUpDown className="text-secondary size-5" />
          </div>
        </Button>
      </div>

      {isOpen && (
        <div
          className="border-light-dark bg-surface-default absolute left-0 right-0 z-50 mx-4 mt-1 w-auto rounded-lg border shadow-lg transition-all duration-200 ease-in-out sm:mx-0"
          role="menu"
        >
          {dropdownItems.map((item) => (
            <Button
              variant="ghost"
              size="lg"
              key={item.id}
              className={cn(
                "w-full",
                !item.isDisabled && "hover:bg-middle-dark",
              )}
              onClick={() => handleSelectItem(item.id, item.href || "")}
              role="menuitemradio"
              aria-checked={item.id === selectedHeaderSidebarItem}
              disabled={item.isDisabled}
            >
              <div className="flex w-full items-center gap-1.5 sm:gap-2">
                <DaoAvatarIcon
                  daoId={item.name}
                  className={cn(
                    "size-icon-xxs sm:size-icon-sm",
                    item.isDisabled && "opacity-75",
                  )}
                  isRounded
                />
                <h1
                  className={cn(
                    "text-primary text-sm font-normal",
                    item.isDisabled && "text-secondary opacity-75",
                  )}
                >
                  {item.label}
                </h1>
                {item.isDisabled && (
                  <BadgeInAnalysis
                    iconClassName="size-3"
                    className="text-xs font-medium"
                  />
                )}
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
