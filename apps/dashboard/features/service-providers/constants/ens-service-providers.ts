import type {
  QuarterKey,
  ServiceProvider,
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
};

export const ENS_SERVICE_PROVIDERS: ServiceProvider[] = [
  {
    name: "Blockful",
    websiteUrl: "https://blockful.io",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-blockful-application/20463",
    budget: 700000,
    githubSlug: "blockful",
    years: {},
  },
  {
    name: "eth.limo",
    websiteUrl: "https://eth.limo",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-eth-limo-application/20369",
    budget: 700000,
    githubSlug: "eth-limo",
    years: {},
  },
  {
    name: "Ethereum Identity Fnd",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-ethereum-identity-foundation-application/20439",
    websiteUrl: "https://ethid.org",
    budget: 500000,
    githubSlug: "ethereum-identity-fnd",
    years: {},
  },
  {
    name: "Unruggable",
    websiteUrl: "https://unruggable.com",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-unruggable-application/20485",
    budget: 400000,
    githubSlug: "unruggable",
    years: {},
  },
  {
    name: "NameHash Labs",
    websiteUrl: "https://namehashlabs.org",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-namehash-labs-application/20502",
    budget: 1100000,
    githubSlug: "namehash-labs",
    years: {},
  },
  {
    name: "Namespace",
    websiteUrl: "https://namespace.tech",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-namespace-application/20456",
    budget: 400000,
    githubSlug: "namespace",
    years: {},
  },
  {
    name: "ZK Email",
    websiteUrl: "https://zkemail.com",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-zk-email-application/20450",
    budget: 400000,
    githubSlug: "zk-email",
    years: {},
  },
  {
    name: "JustaName",
    websiteUrl: "https://justaname.id",
    proposalUrl:
      "https://discuss.ens.domains/t/spp2-justaname-application/20430",
    budget: 300000,
    githubSlug: "justaname",
    years: {},
  },
];
