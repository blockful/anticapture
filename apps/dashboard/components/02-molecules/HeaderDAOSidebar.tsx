"use client";

import { BaseHeaderLayoutSidebar, UniswapIcon } from "@/components/01-atoms";
import { usePathname } from "next/navigation";
import { DaoId, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";

export const HeaderDAOSidebar = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";

  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const isValidDao = daoId && SUPPORTED_DAO_NAMES.includes(daoId as DaoId);

  return (
    <BaseHeaderLayoutSidebar>
      {isValidDao && (
        <div className="flex items-center space-x-2">
          <div className="rounded-[6px] border border-middleDark bg-lightDark p-1.5">
            <UniswapIcon className="h-5 w-5 text-[#FC72FF]" />
          </div>
          <h1 className="text-sm font-semibold text-white">Uniswap GovRisk</h1>
        </div>
      )}
      {!isDefault && !isValidDao && (
        <div className="flex flex-col items-center space-x-2">
          <h1 className="text-sm font-semibold text-white">404 Not Found</h1>
          <h1 className="text-sm font-semibold text-white">
            Please back to Home Page
          </h1>
        </div>
      )}
    </BaseHeaderLayoutSidebar>
  );
};
