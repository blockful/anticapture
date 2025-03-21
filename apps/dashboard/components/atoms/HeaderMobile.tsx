"use client";

import { AnticaptureIcon, ConnectWallet } from "@/components/atoms";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { useSectionObserver } from "@/lib/hooks/useSectionObserver";
import { SUPPORTED_DAO_NAMES, DaoIdEnum } from "@/lib/types/daos";
import { usePathname } from "next/navigation";
import { ButtonHeaderDAOSidebarMobile } from "./ButtonHeaderDAOSidebarMobile";

const NavDao = () => {
  const options = [
    {
      anchorId: SECTIONS_CONSTANTS.daoInfo.anchorId,
      title: SECTIONS_CONSTANTS.daoInfo.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.attackProfitability.anchorId,
      title: SECTIONS_CONSTANTS.attackProfitability.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.tokenDistribution.anchorId,
      title: SECTIONS_CONSTANTS.tokenDistribution.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.governanceActivity.anchorId,
      title: SECTIONS_CONSTANTS.governanceActivity.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.governanceImplementation.anchorId,
      title: SECTIONS_CONSTANTS.governanceImplementation.title,
    },
  ];

  return (
    <div className="w-full">
      <div className="scrollbar-none w-full overflow-x-auto">
        <ButtonHeaderDAOSidebarMobile options={options} />
      </div>
    </div>
  );
};

export const HeaderMobile = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const isValidDao = daoId && SUPPORTED_DAO_NAMES.includes(daoId as DaoIdEnum);

  const { activeSection, handleSectionClick } = useSectionObserver({
    initialSection: SECTIONS_CONSTANTS.daoInfo.anchorId,
  });
  const isActive = (sectionId: string) => activeSection === sectionId;

  return (
    <div className="h-full w-full">
      <div className="px-4 py-3">
        <div className="flex justify-between">
          <div className="flex">
            <AnticaptureIcon />
          </div>
          <div className="flex">
            <ConnectWallet />
          </div>
        </div>
      </div>
      {isValidDao && (
        <div className="border-b border-t border-b-white/10 border-t-white/10">
          <NavDao />
        </div>
      )}
    </div>
  );
};
