import type {
  QuarterKey,
  ServiceProvider,
  SPPKey,
} from "@/features/service-providers/types";

const GITHUB_REPO = "blockful/spp-accountability";

export const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main`;
export const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;

export const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

export const QUARTER_DUE_DATES: Record<
  number,
  Record<QuarterKey, { dueDate: string; dueDateLabel: string }>
> = {
  2025: {
    Q1: { dueDate: "2025-03-31", dueDateLabel: "Due by Mar 31" },
    Q2: { dueDate: "2025-06-30", dueDateLabel: "Due by Jun 30" },
    Q3: { dueDate: "2025-09-30", dueDateLabel: "Due by Sep 30" },
    Q4: { dueDate: "2025-12-31", dueDateLabel: "Due by Dec 31" },
  },
  2026: {
    Q1: { dueDate: "2026-03-31", dueDateLabel: "Due by Mar 31" },
    Q2: { dueDate: "2026-06-30", dueDateLabel: "Due by Jun 30" },
    Q3: { dueDate: "2026-09-30", dueDateLabel: "Due by Sep 30" },
    Q4: { dueDate: "2026-12-31", dueDateLabel: "Due by Dec 31" },
  },
  2027: {
    Q1: { dueDate: "2027-03-31", dueDateLabel: "Due by Mar 31" },
    Q2: { dueDate: "2027-06-30", dueDateLabel: "Due by Jun 30" },
    Q3: { dueDate: "2027-09-30", dueDateLabel: "Due by Sep 30" },
    Q4: { dueDate: "2027-12-31", dueDateLabel: "Due by Dec 31" },
  },
};

// SPP1: Feb 2024 – May 2025 (uniform 1-year stream, 6 providers)
// SPP2: May 26, 2025 onwards — Q3 2025 is the first calendar quarter
//   Blockful + eth.limo: 2-year stream (through Q2 2027)
//   All others: 1-year stream (through Q2 2026)

// SPP1 covered Q1+Q2 2025 (calendar). We only track from 2025 in this repo.
export const SPP1_YEAR_QUARTERS: { year: number; quarter: QuarterKey }[] = [
  { year: 2025, quarter: "Q1" },
  { year: 2025, quarter: "Q2" },
];

// SPP2 Year 1: Q3 2025 – Q2 2026
export const SPP2_YEAR1_QUARTERS: { year: number; quarter: QuarterKey }[] = [
  { year: 2025, quarter: "Q3" },
  { year: 2025, quarter: "Q4" },
  { year: 2026, quarter: "Q1" },
  { year: 2026, quarter: "Q2" },
];

// SPP2 Year 2: Q3 2026 – Q2 2027 (2-year stream providers only)
export const SPP2_YEAR2_QUARTERS: { year: number; quarter: QuarterKey }[] = [
  { year: 2026, quarter: "Q3" },
  { year: 2026, quarter: "Q4" },
  { year: 2027, quarter: "Q1" },
  { year: 2027, quarter: "Q2" },
];

export const SPP_PROGRAMS: SPPKey[] = ["SPP1", "SPP2"];

export const ENS_SERVICE_PROVIDERS: ServiceProvider[] = [
  {
    name: "Blockful",
    websiteUrl: "https://blockful.io",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-blockful-application/20463",
    budget: 700000,
    githubSlug: "blockful",
    sppPrograms: ["SPP1", "SPP2"],
    streamDuration: 2,
    years: {},
  },
  {
    name: "eth.limo",
    websiteUrl: "https://eth.limo",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-eth-limo-application/20369",
    budget: 700000,
    githubSlug: "eth-limo",
    sppPrograms: ["SPP1", "SPP2"],
    streamDuration: 2,
    years: {},
  },
  {
    name: "Ethereum Identity Fnd",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-ethereum-identity-foundation-application/20439",
    websiteUrl: "https://ethid.org",
    budget: 500000,
    githubSlug: "ethereum-identity-fnd",
    sppPrograms: ["SPP1", "SPP2"],
    streamDuration: 1,
    years: {},
  },
  {
    name: "Unruggable",
    websiteUrl: "https://unruggable.com",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-unruggable-application/20485",
    budget: 400000,
    githubSlug: "unruggable",
    sppPrograms: ["SPP1", "SPP2"],
    streamDuration: 1,
    years: {},
  },
  {
    name: "NameHash Labs",
    websiteUrl: "https://namehashlabs.org",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-namehash-labs-application/20502",
    budget: 1100000,
    githubSlug: "namehash-labs",
    sppPrograms: ["SPP1", "SPP2"],
    streamDuration: 1,
    years: {},
  },
  {
    name: "Namespace",
    websiteUrl: "https://namespace.tech",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-namespace-application/20456",
    budget: 400000,
    githubSlug: "namespace",
    sppPrograms: ["SPP1", "SPP2"],
    streamDuration: 1,
    years: {},
  },
  {
    name: "ZK Email",
    websiteUrl: "https://zkemail.com",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-zk-email-application/20450",
    budget: 400000,
    githubSlug: "zk-email",
    sppPrograms: ["SPP2"],
    streamDuration: 1,
    years: {},
  },
  {
    name: "JustaName",
    websiteUrl: "https://justaname.id",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-justaname-application/20430",
    budget: 300000,
    githubSlug: "justaname",
    sppPrograms: ["SPP2"],
    streamDuration: 1,
    years: {},
  },
];
