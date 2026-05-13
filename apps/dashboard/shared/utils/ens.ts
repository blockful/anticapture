import axios from "axios";
import type { Address } from "viem";
import { normalize } from "viem/ens";

const ETH_COIN_TYPE = "60";

type AddressRecordsResponse = {
  records?: {
    addresses?: Record<string, Address>;
  };
  accelerationRequested?: boolean;
  accelerationAttempted?: boolean;
};

export const isEnsAddress = (value: string): boolean => {
  try {
    normalize(value);
  } catch {
    return false;
  }
  return value.endsWith(".eth") && value.slice(0, -4).length >= 3;
};

export const fetchAddressFromEnsName = async ({
  ensName,
}: {
  ensName: `${string}.eth`;
}): Promise<Address | null> => {
  try {
    const normalizedName = normalize(ensName);
    const url = `https://api.alpha.ensnode.io/api/resolve/records/${normalizedName}?addresses=${ETH_COIN_TYPE}&accelerate=true`;
    const response = await axios.get<AddressRecordsResponse>(url);
    return response.data.records?.addresses?.[ETH_COIN_TYPE] || null;
  } catch (error) {
    console.warn(`Failed to fetch address for ${ensName}:`, error);
    return null;
  }
};
