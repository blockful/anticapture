export const buildDraftShareUrl = (
  basePath: string,
  draftId: string,
): string => {
  if (typeof window === "undefined") return "";
  // Clean share URL — the page defaults any link carrying a draftId to the
  // Preview, so no explicit view param is needed.
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
