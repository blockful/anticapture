import { DaoLogoIcon, DaoLogoVariant } from "@/components/atoms";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConfigByDaoId from "@/lib/dao-config";
import { CarretSortIcon } from "@/components/atoms/icons/CarretSortIcon";

interface DaoSelectorMobileProps {
  daoIdEnum: DaoIdEnum;
}

export const DaoSelectorMobile = ({ daoIdEnum }: DaoSelectorMobileProps) => {
  const daoName = daoConfigByDaoId[daoIdEnum]?.name || "";

  return (
    <div className="relative z-30 flex h-[56px] w-full flex-row items-center justify-between bg-black px-5">
      <div className="flex w-full flex-row items-center justify-between gap-4 rounded-md p-1 hover:bg-gray-800">
        <div className="flex flex-row items-center gap-4">
          <DaoLogoIcon
            daoId={daoIdEnum}
            className="size-[36px] rounded-full"
            variant={DaoLogoVariant.DEFAULT}
          />
          <span className="text-xl font-semibold text-white">{daoName}</span>
        </div>
        <CarretSortIcon className="size-6 text-white" />
      </div>
    </div>
  );
};

export default DaoSelectorMobile;
