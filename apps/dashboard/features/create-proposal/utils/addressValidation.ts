import { isAddress, type Address } from "viem";
import { normalize } from "viem/ens";

import { fetchAddressFromEnsName } from "@/shared/hooks/useEnsData";

export const isEnsAddress = (value: string): boolean => {
  try {
    normalize(value);
  } catch {
    return false;
  }
  return value.endsWith(".eth") && value.slice(0, -4).length >= 3;
};

export const isValidAddressOrEns = (value: string): boolean => {
  const v = value.trim();
  if (!v) return false;
  return isAddress(v) || isEnsAddress(v);
};

export const resolveAddressOrEns = async (
  value: string,
): Promise<Address | null> => {
  const v = value.trim();
  if (!v) return null;
  if (isAddress(v)) return v as Address;
  if (isEnsAddress(v)) {
    return fetchAddressFromEnsName({ ensName: v as `${string}.eth` });
  }
  return null;
};
