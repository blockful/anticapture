export const buildDraftShareUrl = (
  basePath: string,
  draftId: string,
): string => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${basePath}/proposals/new?draftId=${draftId}`;
};

export const copyDraftShareUrl = (basePath: string, draftId: string): void => {
  void navigator.clipboard.writeText(buildDraftShareUrl(basePath, draftId));
};
