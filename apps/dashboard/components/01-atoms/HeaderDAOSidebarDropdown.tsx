"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeftIcon, UniswapIcon } from "@/components/01-atoms";
import { useRouter } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { ChevronsUpDown } from "lucide-react";

export const HeaderDAOSidebarDropdown = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedHeaderSidebarItem, setSelectedHeaderSidebarItem] =
    useState<number>(0);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        label: "Uniswap GovRisk",
        icon: <UniswapIcon className="h-5 w-5 text-[#FC72FF]" />,
        href: `/${DaoIdEnum.UNISWAP.toLowerCase()}`,
      },
      // {
      //   id: 1,
      //   label: "ENS GovRisk",
      //   icon: <EnsIcon className="h-5 w-5" />,
      //   href: `/${DaoId.ENS.toLowerCase()}`,
      // },
    ],
    [],
  );

  const currentItem = dropdownItems.find(
    (item) => item.id === selectedHeaderSidebarItem,
  );

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleSelectItem = (id: number, href: string) => {
    setSelectedHeaderSidebarItem(id);
    sessionStorage.setItem("selectedHeaderSidebarItem", id.toString());
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      <div className="border-b border-b-lightDark p-3">
        <button
          className="group flex gap-x-1.5 text-xs font-medium text-foreground hover:text-white"
          onClick={() => {
            router.back();
          }}
        >
          <ArrowLeftIcon className="group-[hover]:text-white" />
          Back to dashboard
        </button>
      </div>
      <div className="p-3">
        <button
          className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-[#333]"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <div className="flex w-full items-center gap-2">
            <div className="rounded-[6px] border border-middleDark bg-lightDark p-1.5">
              {currentItem?.icon}
            </div>
            <h1 className="text-sm font-semibold text-white">
              {currentItem?.label}
            </h1>
          </div>
          <div>
            <ChevronsUpDown className="text-white" />
          </div>
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full rounded-lg border border-middleDark bg-lightDark p-2 shadow-lg"
          role="menu"
        >
          {dropdownItems.map((item) => (
            <button
              key={item.id}
              className={
                "flex w-full items-center justify-between gap-2 rounded-lg p-2 hover:bg-[#333]"
              }
              onClick={() => handleSelectItem(item.id, item.href)}
              role="menuitemradio"
              aria-checked={item.id === selectedHeaderSidebarItem}
            >
              <div className="flex w-full items-center gap-2">
                <div className="rounded-[6px] border border-middleDark bg-lightDark p-1.5">
                  {item.icon}
                </div>
                <h1 className="text-sm font-semibold text-white">
                  {item.label}
                </h1>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
