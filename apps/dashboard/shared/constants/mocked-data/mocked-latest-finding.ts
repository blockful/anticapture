/**
 * Stand-in for the latest Paragraph publication rendered by the panel ticker.
 * TODO(DEV-1148): replace with a server-side fetch of the newest post once the
 * Paragraph API is wired up; the ticker only needs `finding` and `caseUrl`.
 */
export const mockedLatestFinding = {
  finding:
    "Uniswap: a low-cost path to a multi-billion-dollar treasury, quantified before it could be exploited.",
  caseUrl: "https://paragraph.com/@blockful",
};
