import { DaoIdEnum } from "@/lib/types/daos";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { MetricTypesEnum } from "../client/constants";
import { Address } from "viem";

export enum ChainNameEnum {
  Ethereum = "ethereum",
}

export type DaoMetricsDayBucket = {
  date: string;
  daoId: DaoIdEnum;
  tokenId: Address;
  metricType: MetricTypesEnum;
  open: string;
  close: string;
  low: string;
  high: string;
  average: string;
  volume: string;
  count: number;
};
