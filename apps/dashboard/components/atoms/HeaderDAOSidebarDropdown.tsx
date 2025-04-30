"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { DaoAvatarIcon, DaoAvatarSize } from "@/components/atoms";
import { useParams, useRouter } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { ChevronsUpDown } from "lucide-react";
import ArbitrumIcon from "@/public/logo/Arbitrum.png";
import Image from "next/image";

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
            size={DaoAvatarSize.MEDIUM}
            isRounded
          />
        ),
        href: `/${DaoIdEnum.UNISWAP.toLowerCase()}`,
        name: DaoIdEnum.UNISWAP,
      },
      {
        id: 1,
        label: "ENS",
        icon: <DaoAvatarIcon daoId={DaoIdEnum.ENS} className="size-5" />,
        href: `/${DaoIdEnum.ENS.toLowerCase()}`,
        name: DaoIdEnum.ENS,
      },
      {
        id: 2,
        label: "Arbitrum",
        icon: (
          <div className="size-5 rounded-full bg-white">
            <Image src={ArbitrumIcon} alt="Arbitrum" className="size-5" />
          </div>
        ),
        href: `/${DaoIdEnum.ARBITRUM.toLowerCase()}`,
        name: DaoIdEnum.ARBITRUM,
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
    <div className="relative inline-block w-full" ref={dropdownRef}>
      <div className="border-b border-lightDark px-3 py-2">
        <button
          className="flex w-full items-center justify-between gap-2 px-2 py-1.5 hover:bg-[#333] sm:rounded-md sm:p-1"
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
          className="absolute z-50 mt-2 w-full rounded-lg border border-lightDark bg-dark p-2 shadow-lg"
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
                <div>{item.icon}</div>
                <h1 className="text-[18px] font-medium leading-6 text-[#FAFAFA]">
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
