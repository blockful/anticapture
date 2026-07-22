export const REPORT_PANELS_BY_SECTION = {
  overview: ["Overview metrics", "Resilience stages", "Attack exposure"],
  "holders-and-delegates": ["Holders", "Delegates", "Delegation history"],
  "token-distribution": ["Token distribution", "Supply metrics", "Charts"],
  governance: ["Governance settings", "Voting", "Quorum"],
  proposals: ["Proposals", "Proposal details", "Voting"],
  "attack-profitability": ["Attack profitability", "Treasury monitoring"],
  "activity-feed": ["Activity feed", "Activity filters"],
  "service-providers": ["Service providers", "Provider details"],
  "resilience-stages": ["Resilience stages", "Protection levels"],
  revenue: ["Revenue", "Revenue charts"],
  "risk-analysis": ["Risk analysis", "Risk metrics"],
} as const;

export type ReportSection = keyof typeof REPORT_PANELS_BY_SECTION;

const SECTION_ALIASES: Record<string, ReportSection> = {
  delegates: "holders-and-delegates",
  "governance-settings": "governance",
  notifications: "governance",
  "spp-accountability": "service-providers",
};

export const getReportSection = (pathname: string): ReportSection => {
  const segment = pathname.split("/").filter(Boolean).at(-1) ?? "overview";
  if (segment in REPORT_PANELS_BY_SECTION) return segment as ReportSection;
  return SECTION_ALIASES[segment] ?? "overview";
};

export const getReportPanels = (section: string) =>
  REPORT_PANELS_BY_SECTION[section as ReportSection] ??
  REPORT_PANELS_BY_SECTION.overview;
