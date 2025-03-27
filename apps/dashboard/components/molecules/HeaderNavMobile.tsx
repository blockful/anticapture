"use client";

import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { ButtonHeaderDAOSidebarMobile } from "@/components/atoms";
import daoConstantsByDaoId from "@/lib/dao-constants";
import { DaoConstantsFullySupported } from "@/lib/dao-constants/types";
import { DaoIdEnum, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
import { usePathname } from "next/navigation";

interface NavOption {
  anchorId: string;
  title: string;
}

export const HeaderNavMobile = () => {
  const pathname = usePathname();
  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const isValidDao = daoId && SUPPORTED_DAO_NAMES.includes(daoId as DaoIdEnum);

  const hasGovernanceImplementation =
    isValidDao &&
    !!(daoConstantsByDaoId[daoId as DaoIdEnum] as DaoConstantsFullySupported)
      .governanceImplementation;

  const options: NavOption[] = [
    {
      anchorId: SECTIONS_CONSTANTS.daoInfo.anchorId,
      title: SECTIONS_CONSTANTS.daoInfo.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.attackProfitability.anchorId,
      title: SECTIONS_CONSTANTS.attackProfitability.title,
    },
    ...(hasGovernanceImplementation
      ? [
          {
            anchorId: SECTIONS_CONSTANTS.governanceImplementation.anchorId,
            title: SECTIONS_CONSTANTS.governanceImplementation.title,
          },
        ]
      : []),
    {
      anchorId: SECTIONS_CONSTANTS.tokenDistribution.anchorId,
      title: SECTIONS_CONSTANTS.tokenDistribution.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.governanceActivity.anchorId,
      title: SECTIONS_CONSTANTS.governanceActivity.title,
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
