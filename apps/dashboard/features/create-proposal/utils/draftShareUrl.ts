export const buildDraftShareUrl = (
  basePath: string,
  draftId: string,
): string => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${basePath}/proposals/new?draftId=${draftId}`;
};

export const copyDraftShareUrl = async (
  basePath: string,
  draftId: string,
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(buildDraftShareUrl(basePath, draftId));
    return true;
  } catch {
    return false;
  }
};
