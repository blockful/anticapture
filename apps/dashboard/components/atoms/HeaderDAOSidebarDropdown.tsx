"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { BadgeInAnalysis } from "@/components/atoms";
import { useParams, useRouter } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { DaoAvatarIcon } from "@/shared/components/icons";

export const HeaderDAOSidebarDropdown = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedHeaderSidebarItem, setSelectedHeaderSidebarItem] =
    useState<number>(0);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { daoId }: { daoId: string } = useParams();

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
      {
        id: 0,
        label: "Uniswap",
        icon: (
          <DaoAvatarIcon
            daoId={DaoIdEnum.UNISWAP}
            className="size-icon-md"
            isRounded
          />
        ),
        href: `/${DaoIdEnum.UNISWAP.toLowerCase()}`,
        name: DaoIdEnum.UNISWAP,
      },
      {
        id: 1,
        label: "ENS",
        icon: (
          <DaoAvatarIcon
            daoId={DaoIdEnum.ENS}
            className="size-icon-md"
            isRounded
          />
        ),
        href: `/${DaoIdEnum.ENS.toLowerCase()}`,
        name: DaoIdEnum.ENS,
      },
      {
        id: 2,
        label: "Arbitrum",
        icon: (
          <DaoAvatarIcon
            daoId={DaoIdEnum.ARBITRUM}
            className="size-icon-md"
            isRounded
          />
        ),
        href: `/${DaoIdEnum.ARBITRUM.toLowerCase()}`,
        name: DaoIdEnum.ARBITRUM,
      },
      {
        id: 3,
        label: "Optimism",
        icon: (
          <DaoAvatarIcon
            daoId={DaoIdEnum.OPTIMISM}
            className="size-icon-md"
            isRounded
          />
        ),
        href: `/${DaoIdEnum.OPTIMISM.toLowerCase()}`,
        name: DaoIdEnum.OPTIMISM,
        isDisabled: true,
      },
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
      className="relative z-50 inline-block h-[57px] w-full border-b border-lightDark sm:h-[65px]"
      ref={dropdownRef}
    >
      <div className="flex h-full items-center justify-between px-3.5 py-3.5 sm:p-2">
        <button
          className="flex w-full items-center justify-between gap-2 rounded-md p-1 hover:bg-[#333] sm:rounded-md sm:p-1"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <div className="flex w-full items-center gap-2">
            <div>{currentItem?.icon}</div>
            <h1 className="text-[18px] font-medium leading-6 text-[#FAFAFA]">
              {currentItem?.label}
            </h1>
          </div>
          <div>
            <ChevronsUpDown className="size-5 text-foreground" />
          </div>
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 z-50 mx-4 mt-1 w-auto rounded-lg border border-lightDark bg-dark shadow-lg transition-all duration-200 ease-in-out sm:mx-0"
          role="menu"
        >
          {dropdownItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2",
                !item.isDisabled && "hover:bg-[#333]",
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
                    "text-sm font-normal text-white",
                    item.isDisabled && "text-foreground opacity-75",
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
