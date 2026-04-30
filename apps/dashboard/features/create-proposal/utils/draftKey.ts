export const draftKey = (daoId: string, address: string): string => {
  return `drafts-${daoId.toLowerCase()}-${address.toLowerCase()}`;
};
