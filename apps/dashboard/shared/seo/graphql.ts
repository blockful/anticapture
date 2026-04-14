import { BACKEND_ENDPOINT, getAuthHeaders } from "@/shared/utils/server-utils";
import type { DaoIdEnum } from "@/shared/types/daos";

const PROPOSAL_BATCH_SIZE = 100;

const GET_PROPOSAL_QUERY = `
  query GetProposalSeoData($id: String!) {
    proposal(id: $id) {
      ... on OnchainProposal {
        id
        title
        description
      }
    }
  }
`;

const GET_OFFCHAIN_PROPOSAL_QUERY = `
  query GetOffchainProposalSeoData($id: String!) {
    offchainProposalById(id: $id) {
      ... on OffchainProposal {
        id
        title
        body
      }
    }
  }
`;

const GET_PROPOSALS_PAGE_QUERY = `
  query GetProposalsPage($skip: Int, $limit: Int = 100) {
    proposals(skip: $skip, limit: $limit, orderDirection: desc) {
      totalCount
      items {
        id
      }
    }
  }
`;

const GET_OFFCHAIN_PROPOSALS_PAGE_QUERY = `
  query GetOffchainProposalsPage($skip: Int, $limit: Int = 100) {
    offchainProposals(skip: $skip, limit: $limit, orderDirection: desc) {
      totalCount
      items {
        id
      }
    }
  }
`;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface ProposalSeoData {
  title: string;
  description?: string | null;
}

interface ProposalPath {
  id: string;
  kind: "onchain" | "offchain";
}

interface ProposalPageResponse {
  totalCount: number;
  items: Array<{ id: string }>;
}

function getBackendEndpoint() {
  if (!BACKEND_ENDPOINT) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not configured.");
  }

  return BACKEND_ENDPOINT;
}

async function fetchGraphQL<TData>(
  daoId: DaoIdEnum,
  query: string,
  variables: Record<string, unknown>,
): Promise<TData> {
  const response = await fetch(getBackendEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anticapture-dao-id": daoId,
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GraphQL request returned no data.");
  }

  return payload.data;
}

function stripMarkdown(markdown: string | null | undefined) {
  if (!markdown) {
    return "";
  }

  return markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[`*_>#~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimDescription(text: string, maxLength = 160) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

export async function getOnchainProposalSeoData(
  daoId: DaoIdEnum,
  proposalId: string,
): Promise<ProposalSeoData | null> {
  const data = await fetchGraphQL<{
    proposal: { id: string; title: string; description?: string | null } | null;
  }>(daoId, GET_PROPOSAL_QUERY, { id: proposalId });

  if (!data.proposal?.title) {
    return null;
  }

  return {
    title: data.proposal.title.trim(),
    description: trimDescription(stripMarkdown(data.proposal.description)),
  };
}

export async function getOffchainProposalSeoData(
  daoId: DaoIdEnum,
  proposalId: string,
): Promise<ProposalSeoData | null> {
  const data = await fetchGraphQL<{
    offchainProposalById: {
      id: string;
      title: string;
      body?: string | null;
    } | null;
  }>(daoId, GET_OFFCHAIN_PROPOSAL_QUERY, { id: proposalId });

  if (!data.offchainProposalById?.title) {
    return null;
  }

  return {
    title: data.offchainProposalById.title.trim(),
    description: trimDescription(stripMarkdown(data.offchainProposalById.body)),
  };
}

async function getPaginatedProposalIds(
  daoId: DaoIdEnum,
  query: string,
  kind: ProposalPath["kind"],
): Promise<ProposalPath[]> {
  const collected: ProposalPath[] = [];
  let skip = 0;
  let totalCount = Number.POSITIVE_INFINITY;

  while (skip < totalCount) {
    const data = await fetchGraphQL<{
      proposals?: ProposalPageResponse;
      offchainProposals?: ProposalPageResponse;
    }>(daoId, query, {
      skip,
      limit: PROPOSAL_BATCH_SIZE,
    });

    const page = data.proposals ?? data.offchainProposals;

    if (!page) {
      break;
    }

    totalCount = page.totalCount;

    for (const item of page.items) {
      collected.push({ id: item.id, kind });
    }

    if (page.items.length < PROPOSAL_BATCH_SIZE) {
      break;
    }

    skip += PROPOSAL_BATCH_SIZE;
  }

  return collected;
}

export async function getAllProposalPaths(daoId: DaoIdEnum) {
  const [onchain, offchain] = await Promise.all([
    getPaginatedProposalIds(daoId, GET_PROPOSALS_PAGE_QUERY, "onchain"),
    getPaginatedProposalIds(
      daoId,
      GET_OFFCHAIN_PROPOSALS_PAGE_QUERY,
      "offchain",
    ),
  ]);

  return [...onchain, ...offchain];
}
