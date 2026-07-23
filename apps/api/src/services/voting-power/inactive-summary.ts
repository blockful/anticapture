import {
  DBInactiveVotingPowerSummary,
  InactiveVotingPowerSummaryResponse,
} from "@/mappers";

interface InactiveVotingPowerSummaryRepository {
  getInactiveDelegatedVotingPowerSummary(
    votingPeriodSeconds: number,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBInactiveVotingPowerSummary>;
}

interface VotingPeriodClient {
  getVotingPeriod: () => Promise<bigint>;
  getVotingDelay: () => Promise<bigint>;
}

export class InactiveVotingPowerSummaryService {
  constructor(
    private readonly repository: InactiveVotingPowerSummaryRepository,
    private readonly daoClient: VotingPeriodClient,
    private readonly blockTime: number,
  ) {}

  async getInactiveVotingPowerSummary(
    fromDate?: number,
    toDate?: number,
  ): Promise<InactiveVotingPowerSummaryResponse> {
    // Same voting-window derivation as the proposals-activity service.
    const votingPeriodBlocks = await this.daoClient.getVotingPeriod();
    const votingDelay = await this.daoClient.getVotingDelay();
    const votingPeriodSeconds =
      Number(votingPeriodBlocks + votingDelay) * this.blockTime;

    const summary =
      await this.repository.getInactiveDelegatedVotingPowerSummary(
        votingPeriodSeconds,
        fromDate,
        toDate,
      );

    // A delegate can only be inactive when at least one proposal existed in
    // the window.
    const inactiveDelegatedVotingPower =
      summary.totalProposals === 0 ? 0n : summary.inactiveDelegatedVotingPower;

    const inactivePercentage =
      summary.totalProposals === 0 || summary.totalDelegatedVotingPower === 0n
        ? 0
        : Number(
            (inactiveDelegatedVotingPower * 10000n) /
              summary.totalDelegatedVotingPower,
          ) / 100;

    return {
      totalDelegatedVotingPower: summary.totalDelegatedVotingPower.toString(),
      inactiveDelegatedVotingPower: inactiveDelegatedVotingPower.toString(),
      inactivePercentage,
      totalProposals: summary.totalProposals,
    };
  }
}
