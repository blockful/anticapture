// Generic helper function to find the most recent value at or before a given timestamp
export const findMostRecentValue = <
  T extends { timestamp: number },
  K extends keyof T,
>(
  items: T[],
  targetTimestamp: number,
  valueKey: K,
  defaultValue: T[K],
): T[K] => {
  if (items.length === 0) return defaultValue;

  // Find the index of the last item with timestamp <= targetTimestamp
  const index = items.findLastIndex(
    (item) => item.timestamp <= targetTimestamp,
  );

  // If no item found, return the first item's value or default
  if (index === -1) {
    return items[0]?.timestamp <= targetTimestamp
      ? items[0][valueKey]
      : defaultValue;
  }

  // Return the found item's value
  return items[index][valueKey];
};
