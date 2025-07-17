export interface DonationData {
  title: string;
  description: string;
  address: string;
  ensAddress?: string;
  qrCodeUrl?: string;
  supportedChains: string[];
  chainLinks?: Record<string, string>;
  benefits: string[];
}

import { DaoIdEnum } from "@/shared/types/daos";

export interface FundingSource {
  name: string;
  amount: string;
  date: string;
  daoId: DaoIdEnum;
  link: string;
}

export interface DonationCardProps {
  title: string;
  description: string;
  address: string;
  ensAddress: string;
  qrCodeUrl: string;
  supportedChains: string[];
  chainLinks: Record<string, string>;
}

export interface FundingSourcesCardProps {
  title: string;
  description: string;
  sources: FundingSource[];
}
