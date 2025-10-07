import { DBProposal, ProposalsRequest, VotersResponse } from "@/api/mappers";
import { DAOClient } from "@/interfaces/client";
import { ProposalStatus } from "@/lib/constants";
import { DaysEnum } from "@/lib/enums";
import { Address } from "viem";

interface ProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    status: string[] | undefined,
    fromDate: number | undefined,
  ): Promise<DBProposal[]>;
  getProposalsCount(): Promise<number>;
  getProposalById(proposalId: string): Promise<DBProposal | undefined>;
  getVotingDelay(): Promise<bigint>;
  getProposalNonVoters(
    proposalId: string,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<{ voter: Address; votingPower: bigint }[]>;
  getProposalNonVotersCount(proposalId: string): Promise<number>;
  getLastVotersTimestamp(voters: Address[]): Promise<Record<Address, bigint>>;
  getVotingPowerVariation(
    voters: Address[],
    comparisonTimestamp: number,
  ): Promise<Record<Address, bigint>>;
}

export class ProposalsService {
  constructor(
    private readonly proposalsRepo: ProposalsRepository,
    private readonly daoClient: DAOClient,
  ) {}

  async getVotingDelay(): Promise<bigint> {
    return this.proposalsRepo.getVotingDelay();
  }

  async getProposalsCount(): Promise<number> {
    return this.proposalsRepo.getProposalsCount();
  }

  /**
   * Prepares status array for database query.
   * Maps ACTIVE, DEFEATED, and SUCCEEDED to PENDING (as they're determined on-chain)
   * and removes duplicates.
   */
  private prepareStatusForDatabase(statusArray: string[]): string[] {
    const mappedStatuses = statusArray.map((status) => {
      if (
        status === ProposalStatus.ACTIVE ||
        status === ProposalStatus.DEFEATED ||
        status === ProposalStatus.SUCCEEDED
      ) {
        return ProposalStatus.PENDING;
      }
      return status;
    });

    return [...new Set(mappedStatuses)]; // Remove duplicates
  }

  /**
   * Filters proposals by the originally requested status values.
   * This is necessary because on-chain determined statuses (ACTIVE, DEFEATED, SUCCEEDED)
   * are all stored as PENDING in the database.
   */
  private filterProposalsByStatus(
    proposals: DBProposal[],
    requestedStatuses: string[],
  ): DBProposal[] {
    return proposals.filter((proposal) =>
      requestedStatuses.includes(proposal.status),
    );
  }

  async getProposals({
    skip = 0,
    limit = 10,
    orderDirection = "desc",
    status,
    fromDate,
  }: ProposalsRequest): Promise<DBProposal[]> {
    // 1. Prepare status for database query
    const dbStatuses = status
      ? this.prepareStatusForDatabase(status)
      : undefined;

    // 2. Fetch proposals from database
    const proposals = await this.proposalsRepo.getProposals(
      skip,
      limit,
      orderDirection,
      dbStatuses,
      fromDate,
    );

    // 3. Update each proposal with its real on-chain status
    for (const proposal of proposals) {
      proposal.status = await this.daoClient.getProposalStatus(proposal);
    }

    // 4. Filter by originally requested statuses (handles on-chain determined statuses)
    return status ? this.filterProposalsByStatus(proposals, status) : proposals;
  }

  async getProposalById(proposalId: string): Promise<DBProposal | undefined> {
    const proposal = await this.proposalsRepo.getProposalById(proposalId);

    if (!proposal) {
      return undefined;
    }

    const status = await this.daoClient.getProposalStatus(proposal);

    return { ...proposal, status };
  }

  /**
   * Returns the delegates with active delegations that didn't vote on a given proposal
   */
  async getProposalNonVoters(
    proposalId: string,
    skip: number = 0,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<VotersResponse> {
    const nonVoters = await this.proposalsRepo.getProposalNonVoters(
      proposalId,
      skip,
      limit,
      orderDirection,
      addresses,
    );

    const _addresses = addresses ? addresses : nonVoters.map((v) => v.voter);

    const comparisonTimestamp = Math.floor(Date.now() / 1000 - DaysEnum["30d"]);

    const [lastVotersTimestamp, votingPowerVariation] = await Promise.all([
      this.proposalsRepo.getLastVotersTimestamp(_addresses),
      this.proposalsRepo.getVotingPowerVariation(
        _addresses,
        comparisonTimestamp,
      ),
    ]);

    return {
      totalCount: _addresses
        ? _addresses.length
        : await this.proposalsRepo.getProposalNonVotersCount(proposalId),
      items: nonVoters.map((v) => ({
        voter: v.voter,
        votingPower: v.votingPower.toString(),
        lastVoteTimestamp: Number(lastVotersTimestamp[v.voter] || 0),
        votingPowerVariation: votingPowerVariation[v.voter]?.toString() || "0",
      })),
    };
  }
}
