export const buildDraftShareUrl = (
  basePath: string,
  draftId: string,
): string => {
  if (typeof window === "undefined") return "";
  // Open shared links in Preview: recipients have no editor access, and this
  // avoids a flash of the editor before the shared-draft fetch resolves and
  // forces Preview.
  return `${window.location.origin}${basePath}/proposals/new?draftId=${draftId}&view=preview`;
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
