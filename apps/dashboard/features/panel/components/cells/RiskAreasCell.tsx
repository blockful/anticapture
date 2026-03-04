import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";
import {
  RiskAreaItem,
  RiskAreasTooltip,
} from "@/features/panel/components/tooltips/RiskAreasTooltip";
import { RiskAreaCardEnum, RiskAreaCardWrapper } from "@/shared/components";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { RISK_AREAS } from "@/shared/constants/risk-areas";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { RiskAreaEnum } from "@/shared/types/enums";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";

const computeRiskAreas = (daoId: DaoIdEnum) => {
  const daoRiskAreas = getDaoRiskAreas(daoId);
  const daoConstants = daoConfigByDaoId[daoId.toUpperCase() as DaoIdEnum];

  const riskAreas = Object.entries(daoRiskAreas).map(([name, info]) => {
    if (name === RiskAreaEnum.ECONOMIC_SECURITY) {
      return {
        name,
        level: !daoConstants?.attackProfitability?.supportsLiquidTreasuryCall
          ? RiskLevel.NONE
          : info.riskLevel,
      };
    }
    return { name, level: info.riskLevel };
  });

  const defenseAreas = daoConstants?.attackExposure?.defenseAreas;

  const riskAreaItems = riskAreas.map(
    (area) =>
      ({
        ...area,
        ...RISK_AREAS[area.name as RiskAreaEnum],
        riskLevel: area.level,
        ...(defenseAreas?.[area.name as RiskAreaEnum]?.description && {
          description: defenseAreas[area.name as RiskAreaEnum]!.description,
        }),
      }) as RiskAreaItem,
  );

  return { riskAreas, riskAreaItems };
};

export const RiskAreasCell = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { riskAreas, riskAreaItems } = computeRiskAreas(daoId);

  return (
    <Tooltip
      className="text-left"
      triggerClassName="w-full"
      disableMobileClick
      tooltipContent={
        <RiskAreasTooltip
          items={riskAreaItems}
          footer="Click on the cell to see details"
        />
      }
    >
      <ClickableCell
        href={`/${daoId.toLowerCase()}/risk-analysis`}
        className="justify-end px-4 py-3 text-end text-sm font-normal"
      >
        <RiskAreaCardWrapper
          daoId={daoId}
          riskAreas={riskAreas}
          variant={RiskAreaCardEnum.PANEL_TABLE}
          className="flex w-full flex-row gap-1"
          withTitle={false}
        />
      </ClickableCell>
    </Tooltip>
  );
};
