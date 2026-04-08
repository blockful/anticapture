"use client";

import { useParams } from "next/navigation";

import { ContractCard } from "@/features/governance-settings/components/ContractCard";
import { ParameterCard } from "@/features/governance-settings/components/ParameterCard";
import { useGovernanceSettingsData } from "@/features/governance-settings/hooks/useGovernanceSettingsData";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export const GovernanceSettingsSection = () => {
  const daoIdParam = useParams().daoId as string;
  const daoId = daoIdParam.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoId];
  const { parameters, contracts, isLoading } = useGovernanceSettingsData(daoId);

  const blockExplorerUrl =
    daoConfig.daoOverview.chain.blockExplorers?.default?.url ??
    "https://etherscan.io";

  return (
    <div className="mx-auto flex w-full max-w-[1096px] flex-col gap-6 px-5 py-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-primary text-2xl font-medium">
          Governance Settings
        </h1>
        <p className="text-secondary text-sm">
          View the contracts and parameters that govern how this DAO operates.
        </p>
      </div>

      {/* Parameters */}
      <div className="flex flex-col gap-3">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
};
