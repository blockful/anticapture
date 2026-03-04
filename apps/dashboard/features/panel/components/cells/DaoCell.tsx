import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";
import { DaoTooltip } from "@/features/panel/components/tooltips/DaoTooltip";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { DaoAvatarIcon } from "@/shared/components/icons";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

export const DaoCell = ({ daoId }: { daoId: DaoIdEnum }) => {
  const config = daoConfigByDaoId[daoId];

  return (
    <Tooltip
      tooltipContent={
        <DaoTooltip
          title={`${config.name} DAO`}
          subtitle="Click and check a security overview."
          avatar={
            <DaoAvatarIcon
              daoId={daoId}
              className="size-9 rounded-full"
              isRounded={true}
            />
          }
        />
      }
      disableMobileClick
      triggerClassName="w-full"
    >
      <ClickableCell
        href={config.disableDaoPage ? undefined : `/${daoId.toLowerCase()}`}
        className="px-4 py-3.5 text-end text-sm font-normal"
      >
        <div className="flex w-full items-center gap-1.5">
          <DaoAvatarIcon
            daoId={daoId}
            className="size-icon-sm"
            isRounded={true}
          />
          <span className="text-primary hidden whitespace-nowrap text-sm font-medium lg:inline">
            {config.name}
          </span>
        </div>
      </ClickableCell>
    </Tooltip>
  );
};
