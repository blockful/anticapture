"use client";

import { useParams } from "next/navigation";

import { ContractCard } from "@/features/governance-settings/components/ContractCard";
import { ParameterCard } from "@/features/governance-settings/components/ParameterCard";
import { useGovernanceSettingsData } from "@/features/governance-settings/hooks/useGovernanceSettingsData";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { TheSectionLayout } from "@/shared/components";
import { Settings } from "lucide-react";

export const GovernanceSettingsSection = () => {
  const daoIdParam = useParams().daoId as string;
  const daoId = daoIdParam.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoId];
  const { parameters, contracts, isLoading } = useGovernanceSettingsData(daoId);

  const blockExplorerUrl =
    daoConfig.daoOverview.chain.blockExplorers?.default?.url ??
    "https://etherscan.io";

  return (
    <TheSectionLayout
      title={"Governance Settings"}
      icon={<Settings className="section-layout-icon" />}
      description={
        "View the contracts and parameters that govern how this DAO operates."
      }
    >
      {/* Parameters */}
      <div className="flex flex-col gap-3 pb-3">
        <h2 className="text-secondary text-xs font-medium">Parameters</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {parameters.map((param) => (
            <ParameterCard
              key={param.label}
              label={param.label}
              value={param.value}
              description={param.description}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Contracts */}
      {contracts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-secondary text-xs font-medium">Contracts</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contracts.map((contract) => (
              <ContractCard
                key={contract.label}
                label={contract.label}
                address={contract.address}
                chainBlockExplorerUrl={blockExplorerUrl}
              />
            ))}
          </div>
        </div>
      )}
    </TheSectionLayout>
  );
};
