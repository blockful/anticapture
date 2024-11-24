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
