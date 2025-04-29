"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { DaoLogoIcon, DaoLogoVariant } from "@/components/atoms";
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
          <DaoLogoIcon
            daoId={DaoIdEnum.UNISWAP}
            variant={DaoLogoVariant.SECONDARY}
            className="h-5 w-5 text-[#FC72FF]"
          />
        ),
        href: `/${DaoIdEnum.UNISWAP.toLowerCase()}`,
        name: DaoIdEnum.UNISWAP,
      },
      {
        id: 1,
        label: "ENS",
        icon: <DaoLogoIcon daoId={DaoIdEnum.ENS} className="h-5 w-5" />,
        href: `/${DaoIdEnum.ENS.toLowerCase()}`,
        name: DaoIdEnum.ENS,
      },
      {
        id: 2,
        label: "Arbitrum",
        icon: (
          <div className="h-5 w-5 rounded-full bg-white">
            <Image src={ArbitrumIcon} alt="Arbitrum" className="h-5 w-5" />
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
    <div
      className="relative z-50 inline-block h-[65px] w-full border-b border-lightDark"
      ref={dropdownRef}
    >
      <div className="flex h-full items-center justify-between px-2 py-[7px]">
        <button
          className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-[#333]"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <div className="flex w-full items-center gap-2">
            <div className="rounded-[6px] border border-lightDark bg-dark p-1.5">
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
                <div className="rounded-[6px] border border-lightDark bg-dark p-1.5">
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
