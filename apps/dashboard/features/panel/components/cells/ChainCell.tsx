import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

export const ChainCell = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { icon: ChainIcon, name: chainName } =
    daoConfigByDaoId[daoId].daoOverview.chain;

  return (
    <div className="scrollbar-none flex w-full items-center gap-3 overflow-auto">
      <Tooltip
        tooltipContent={
          <div>
            <p>{chainName}</p>
          </div>
        }
      >
        <ChainIcon className="size-6 rounded-full" />
      </Tooltip>
    </div>
  );
};
