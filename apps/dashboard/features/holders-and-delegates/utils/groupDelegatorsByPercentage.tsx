export interface DelegatorItem {
  accountId: string;
  balance: string;
}

export interface GroupedDelegatorsResult {
  significantDelegators: DelegatorItem[];
  minorDelegators: DelegatorItem[];
  othersValue: number;
  total: number;
}

/**
 * Groups delegators into significant (>1%) and minor (<=1%) categories
 * @param delegators - Array of delegator items with accountId and balance
 * @returns Object with separated delegators and calculated values
 */
export const groupDelegatorsByPercentage = (
  delegators: DelegatorItem[] | null | undefined,
): GroupedDelegatorsResult => {
  if (!delegators || delegators.length === 0) {
    return {
      significantDelegators: [],
      minorDelegators: [],
      othersValue: 0,
      total: 0,
    };
  }

  // Sort by balance (descending)
  const sorted = [...delegators].sort(
    (a, b) => Number(b.balance) - Number(a.balance),
  );

  // Calculate total value
  const total = sorted.reduce((acc, item) => acc + Number(item.balance), 0);

  // Separate by percentage (> 1% vs <= 1%)
  const significantDelegators = sorted.filter((item) => {
    const percentage = (Number(item.balance) / total) * 100;
    return percentage > 1;
  });

  const minorDelegators = sorted.filter((item) => {
    const percentage = (Number(item.balance) / total) * 100;
    return percentage <= 1;
  });

  // Calculate others value
  const othersValue = minorDelegators.reduce(
    (acc, item) => acc + Number(item.balance),
    0,
  );

  return {
    significantDelegators,
    minorDelegators,
    othersValue,
    total,
  };
};
