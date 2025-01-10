type ValueNamesByDao = {
  name: string;
  daos: string[];
}[];

export const getValueFromEventArgs = <T, K extends { [k: string]: any }>(
  valueNames: ValueNamesByDao,
  args: K,
  daoId: string
): T => {
  const valueName = valueNames.find(({ daos }) => daos.includes(daoId))?.name;
  if (!valueName) {
    throw new Error("Couldn't find dao in value names string");
  }
  const entries = Object.entries(args).find(([key, _]) => {
    return key === valueName;
  });
  if (!entries) {
    throw new Error("Couldn't find value in event.args");
  }
  const [_, value] = entries;
  return value;
};

export const convertSecondsTimestampToDate = (timestamp: number) => {
  return new Date(parseInt(String(timestamp) + "000"));
};

/**
 * Calculates the absolute difference between two numbers
 */
export function delta(a: bigint, b: bigint): bigint {
  return a > b ? a - b : b - a;
}

/**
 * Returns the minimum of two or more numbers
 */
export function min(...values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error('At least one value must be provided');
  }
  return values.reduce((min, value) => value < min ? value : min);
}

/**
 * Returns the maximum of two or more numbers
 */
export function max(...values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error('At least one value must be provided');
  }
  return values.reduce((max, value) => value > max ? value : max);
}