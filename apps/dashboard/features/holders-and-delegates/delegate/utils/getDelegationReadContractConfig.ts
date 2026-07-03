import type { Address } from "viem";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoOverviewConfig } from "@/shared/dao-config/types";
import { DaoIdEnum } from "@/shared/types/daos";

type DelegationReadContracts = DaoOverviewConfig["contracts"];

export const DelegationReadAbi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "delegates",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "delegatedTo",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type DelegationReadFunctionName = "delegates" | "delegatedTo";

interface DelegationReadContractConfig {
  address?: Address;
  functionName: DelegationReadFunctionName;
}

const getTokenAddress = (
  token: DelegationReadContracts["token"] | undefined,
): Address | undefined => (typeof token === "string" ? token : undefined);

export const getDelegationReadContractConfig = (
  daoId: DaoIdEnum,
  contracts: Partial<DelegationReadContracts> = daoConfigByDaoId[daoId]
    .daoOverview.contracts,
): DelegationReadContractConfig => {
  if (daoId === DaoIdEnum.TORN) {
    return {
      address: contracts.governor,
      functionName: "delegatedTo",
    };
  }

  return {
    address: getTokenAddress(contracts.token),
    functionName: "delegates",
  };
};
