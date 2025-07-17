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

export interface FundingSource {
  name: string;
  amount: string;
  date: string;
  logo?: string;
  link?: string;
}

export interface DonationCardProps {
  title: string;
  description: string;
  address: string;
  ensAddress?: string;
  qrCodeUrl?: string;
  supportedChains?: string[];
  chainLinks?: Record<string, string>;
  benefits?: string[];
}

export interface FundingSourcesCardProps {
  title: string;
  description: string;
  sources: FundingSource[];
}
