import { Injectable } from '@nestjs/common';
import { zeroAddress } from 'src/lib/constants';
import { DaysEnum } from 'src/lib/enums/dateEnum';
import { PrismaService } from 'src/prisma/prisma.service';
import { formatUnits } from 'viem';

@Injectable()
export class DaoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.dAO.findMany();
  }

  async findOne(id: string) {
    const dao = await this.prisma.dAO.findUnique({
      where: { id },
      include: { daoTokens: { include: { token: true } } },
    });

    const totalSupply = dao.daoTokens[0].token.totalSupply;
    delete dao.daoTokens;
    return {
      ...dao,
      totalSupply,
    };
  }

  private async votingPowerWithActivity(id: string, activeSince: bigint) {
    const activeVotingPowerAndCount: [
      { activeDelegatesCount: string; activeVotingPower: string },
    ] = await this.prisma.$queryRaw`
        with lastActivityByUser as (
          SELECT GREATEST(voc.timestamp, poc.timestamp) as "lastActivityTimestamp", voc."voterAccountId" as user, voc."daoId",
          case when GREATEST(voc.timestamp, poc.timestamp) >= CAST(${activeSince} as bigint) then true
            else false END
            as "active"
          FROM public."VotesOnchain" voc 
          full outer join public."ProposalsOnchain" poc on voc."voterAccountId"=poc."proposerAccountId" 
        )
        SELECT TEXT(COUNT(distinct lastActivityByUser.user)) as "activeDelegatesCount",
        TEXT(SUM(distinct activeAp."votingPower")) as "activeVotingPower"
        from lastActivityByUser
        join "AccountPower" activeAp on activeAp."accountId"=lastActivityByUser.user
        where lastActivityByUser."daoId"=${id}
        and activeAp."daoId"=${id}
        and lastActivityByUser.active=true
        and activeAp."delegationsCount">0;
      `;
    const totalVotingPowerAndCount: [
      { totalDelegatesCount: string; totalVotingPower: string },
    ] = await this.prisma.$queryRaw`
      SELECT TEXT(COUNT(DISTINCT ap."accountId")) as "totalDelegatesCount", 
      TEXT(SUM(ap."votingPower")) as "totalVotingPower" 
      FROM "AccountPower" ap 
      WHERE ap."daoId"=${id} and ap."delegationsCount">0;
    `;
    return { ...activeVotingPowerAndCount[0], ...totalVotingPowerAndCount[0] };
  }

  private async averageTurnout(id: string, fromDate: bigint, toDate: bigint) {
    const averageTurnout: [{ averageTurnout: string }] = await this.prisma
      .$queryRaw`
        select TEXT(AVG(po."forVotes" + po."againstVotes" + po."abstainVotes")) as "averageTurnout"
        from "ProposalsOnchain" po where po.timestamp BETWEEN CAST(${fromDate} as bigint) and CAST(${toDate} as bigint)
        AND po.status='EXECUTED' or po.status='CANCELED' AND po."daoId"=${id};
      `;
    return { ...averageTurnout[0] };
  }

  public async getDelegatesFromDao(
    daoId: string,
    fromDate: bigint,
    take: number,
    skip: number,
    orderBy: 'account' | 'delegationsCount' | 'votingPower' | 'proposalsVoted',
    ordering: 'ASC' | 'DESC',
    toDate: bigint,
  ): Promise<{
    delegates: {
      account: string;
      votingPower: string;
      proposalsVoted: string;
    }[];
    totalProposals: number;
  }> {
    const orderByValues = {
      account: 'a.id',
      delegationsCount: 'ap."delegationsCount"',
      votingPower: 'ap."votingPower"',
      proposalsVoted: '"proposalsVoted"',
    };

    const delegates: {
      account: string;
      votingPower: string;
      proposalsVoted: string;
    }[] = await this.prisma.$queryRawUnsafe(`
      select a.id as "account", 
      TEXT(ap."votingPower") as "votingPower", 
      TEXT(ap."delegationsCount") as "delegationsCount", 
      TEXT(COUNT(distinct voc.*)) as "proposalsVoted" 
      from "Account" a 
      left join "AccountPower" ap on a.id=ap."accountId"
      left join "VotesOnchain" voc on voc."voterAccountId"=a.id
      where voc.timestamp BETWEEN CAST(${fromDate} as bigint) and CAST(${toDate} as bigint)
      AND ap."votingPower" is not null
      and ap."daoId"='${daoId}'
      group by a.id, ap."votingPower", ap."delegationsCount"
      order by ${orderByValues[orderBy]} ${ordering}
      offset ${skip} limit ${take};
    `);

    const totalProposals = await this.prisma.proposalsOnchain.count({
      where: {
        AND: [
          { timestamp: { gte: String(fromDate) } },
          { timestamp: { lte: String(toDate ?? Date.now()) } },
        ],
      },
    });

    return { delegates, totalProposals };
  }

  public async getHoldersFromDao(
    daoId: string,
    take?: number,
    skip?: number,
    orderBy?: 'account' | 'amount' | 'lastBuy',
    ordering?: 'ASC' | 'DESC',
  ) {
    const orderByValues = {
      amount: 'ab.balance',
      account: 'a.id',
      lastBuy: 'Max(tr.timestamp)',
    };

    const getHoldersQuery = `
      select a.id as "account",
      TEXT(ab.balance) as "amount",
      TEXT(COUNT(d.*)) as "countOfDelegates",
      TEXT(MAX(tr.timestamp)) as "lastBuy" from "Account" a 
      left join "AccountBalance" ab on a.id=ab."accountId"
      right join "Token" t on t.id =ab."tokenId"
      right join "DAOToken" dt on dt."tokenId"=t.id
      right join "Transfers" tr on tr."toAccountId"=a.id
      left join "Delegations" d on a.id=d."delegatorAccountId"
      where dt."daoId"='${daoId}'
      group by a.id, ab.balance
      order by ${orderByValues[orderBy]} ${ordering || 'DESC'}
      offset ${skip ?? 0} limit ${take ?? 10};
    `;
    const holders = await this.prisma.$queryRawUnsafe(getHoldersQuery);

    return holders;
  }

  public async attackCosts(
    daoId: string,
    activeSince: bigint,
    votingPowerWithActivity: {
      totalDelegatesCount: string;
      totalVotingPower: string;
      activeDelegatesCount: string;
      activeVotingPower: string;
    },
    avgTurnoutAndApproval: {
      averageApprovalVotes: string;
      averageTurnout: string;
    },
  ) {
    const batchSize = 2000;
    let { delegates: activeDelegates } = await this.getDelegatesFromDao(
      daoId,
      activeSince,
      batchSize,
      0,
      'votingPower',
      'DESC',
      BigInt(Date.now().toString()),
    );
    let { delegates } = await this.getDelegatesFromDao(
      daoId,
      0n,
      batchSize,
      0,
      'votingPower',
      'DESC',
      BigInt(Date.now().toString()),
    );
    let delegatesVotingPowerSum = 0n;
    let activeDelegatesVotingPowerSum = 0n;
    let topActiveDelegatesForAverageTurnout: number;
    let topActiveDelegatesForTotalVotingPower: number;
    let topActiveDelegatesForActiveVotingPower: number;
    let topDelegatesForAverageTurnout: number;
    let topDelegatesForTotalVotingPower: number;
    let topDelegatesForActiveVotingPower: number;
    let delegatesIdx: number = 0;
    let activeDelegatesIdx: number = 0;
    const averageTurnoutCost =
      BigInt(avgTurnoutAndApproval.averageTurnout) / 2n;
    const totalVotingPowerCost =
      BigInt(votingPowerWithActivity.totalVotingPower) / 2n;
    const activeVotingPowerCost =
      BigInt(votingPowerWithActivity.activeVotingPower) / 2n;
    while (
      activeDelegatesVotingPowerSum < totalVotingPowerCost &&
      delegatesVotingPowerSum < totalVotingPowerCost &&
      (topActiveDelegatesForAverageTurnout === undefined ||
        topActiveDelegatesForTotalVotingPower === undefined ||
        topActiveDelegatesForActiveVotingPower === undefined ||
        topDelegatesForAverageTurnout === undefined ||
        topDelegatesForTotalVotingPower === undefined ||
        topDelegatesForActiveVotingPower === undefined)
    ) {
      try {
        if (delegatesIdx === delegates.length) {
          const { delegates: delegatesToAppend } =
            await this.getDelegatesFromDao(
              daoId,
              0n,
              batchSize,
              delegates.length,
              'votingPower',
              'DESC',
              BigInt(Date.now().toString()),
            );
          delegates = [...delegates, ...delegatesToAppend];
          if (delegatesToAppend.length === 0) {
            topDelegatesForActiveVotingPower =
              topDelegatesForActiveVotingPower ?? 0;
            topDelegatesForTotalVotingPower =
              topDelegatesForTotalVotingPower ?? 0;
            topDelegatesForAverageTurnout = topDelegatesForAverageTurnout ?? 0;
          }
        }
        if (activeDelegatesIdx === activeDelegates.length) {
          const { delegates: activeDelegatesToAppend } =
            await this.getDelegatesFromDao(
              daoId,
              activeSince,
              batchSize,
              activeDelegates.length,
              'votingPower',
              'DESC',
              BigInt(Date.now().toString()),
            );
          activeDelegates = [...activeDelegates, ...activeDelegatesToAppend];
          if (activeDelegatesToAppend.length === 0) {
            topActiveDelegatesForActiveVotingPower =
              topActiveDelegatesForActiveVotingPower ?? 0;
            topActiveDelegatesForTotalVotingPower =
              topActiveDelegatesForTotalVotingPower ?? 0;
            topActiveDelegatesForAverageTurnout =
              topActiveDelegatesForAverageTurnout ?? 0;
          }
        }
        if (
          topDelegatesForTotalVotingPower === undefined ||
          topDelegatesForActiveVotingPower === undefined ||
          topDelegatesForAverageTurnout === undefined
        ) {
          delegatesVotingPowerSum += BigInt(
            delegates[delegatesIdx].votingPower,
          );
          delegatesIdx++;
        }

        if (
          topActiveDelegatesForTotalVotingPower === undefined ||
          topActiveDelegatesForActiveVotingPower === undefined ||
          topActiveDelegatesForAverageTurnout === undefined
        ) {
          activeDelegatesVotingPowerSum += BigInt(
            activeDelegates[activeDelegatesIdx].votingPower,
          );
          activeDelegatesIdx++;
        }

        // 1 - Active Delegates - Average Turnout
        if (
          !topActiveDelegatesForAverageTurnout &&
          activeDelegatesVotingPowerSum > averageTurnoutCost
        ) {
          topActiveDelegatesForAverageTurnout = delegatesIdx;
        }

        // 2 - Active Delegates - Active Voting Power
        if (
          !topActiveDelegatesForActiveVotingPower &&
          activeDelegatesVotingPowerSum > activeVotingPowerCost
        ) {
          topActiveDelegatesForActiveVotingPower = delegatesIdx;
        }
        // 3 - Active Delegates - Total Voting Power
        if (
          !topActiveDelegatesForTotalVotingPower &&
          activeDelegatesVotingPowerSum > totalVotingPowerCost
        ) {
          topActiveDelegatesForTotalVotingPower = delegatesIdx;
        }
        // 4 - Total Delegates - Average Turnout
        if (
          !topDelegatesForAverageTurnout &&
          delegatesVotingPowerSum > averageTurnoutCost
        ) {
          topDelegatesForAverageTurnout = delegatesIdx;
        }
        // 5 - Total Delegates - Active Voting Power
        if (
          !topDelegatesForActiveVotingPower &&
          delegatesVotingPowerSum > activeVotingPowerCost
        ) {
          topDelegatesForActiveVotingPower = delegatesIdx;
        }
        // 6 - Total Delegates - Total Voting Power
        if (
          !topDelegatesForTotalVotingPower &&
          delegatesVotingPowerSum > totalVotingPowerCost
        ) {
          topDelegatesForTotalVotingPower = delegatesIdx;
        }
      } catch (e) {
        console.error(e);
        console.log(activeDelegates.length);
        console.log(activeDelegatesIdx);
        console.log(activeDelegates[activeDelegatesIdx]);
        throw new Error('Error');
      }
    }
    if (
      topActiveDelegatesForAverageTurnout === undefined ||
      topActiveDelegatesForActiveVotingPower === undefined ||
      topActiveDelegatesForTotalVotingPower === undefined ||
      topDelegatesForAverageTurnout === undefined ||
      topDelegatesForActiveVotingPower === undefined ||
      topDelegatesForTotalVotingPower === undefined
    ) {
      throw new Error(
        "Error calculating attack costs: Some of the values didn't get calculated",
      );
    }
    return {
      averageTurnoutCost: String(averageTurnoutCost),
      totalVotingPowerCost: String(totalVotingPowerCost),
      activeVotingPowerCost: String(activeVotingPowerCost),
      topActiveDelegatesForAverageTurnout,
      topActiveDelegatesForActiveVotingPower,
      topActiveDelegatesForTotalVotingPower,
      topDelegatesForAverageTurnout,
      topDelegatesForActiveVotingPower,
      topDelegatesForTotalVotingPower,
    };
  }

  async getTotalSupplyCompare(daoId: string, days: DaysEnum) {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days]);
    const [totalSupplyCompare]: [
      {
        oldTotalSupply: bigint;
        currentTotalSupply: bigint;
      },
    ] = await this.prisma.$queryRaw`
          WITH "fromZeroAddressOld" as (
            SELECT SUM(t.amount) as "fromAmount" 
            FROM "Transfers" t 
            WHERE t."fromAccountId"=${zeroAddress} 
          AND t."daoId" = ${daoId}
          AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "toZeroAddressOld" as (
            SELECT SUM(t.amount) as "toAmount" 
            FROM "Transfers" t 
            WHERE t."toAccountId"=${zeroAddress} 
          AND t."daoId" = ${daoId}
          AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "fromZeroAddressCurrent" as (
            SELECT SUM(t.amount) as "fromAmount" 
            FROM "Transfers" t 
            WHERE t."fromAccountId"=${zeroAddress}  
          AND t."daoId" = ${daoId}
          AND timestamp < ${BigInt(Date.now().toString().slice(0, 10))}
          ),
          "toZeroAddressCurrent" as (
            SELECT SUM(t.amount) as "toAmount" 
            FROM "Transfers" t 
            WHERE t."toAccountId"=${zeroAddress}  
          AND t."daoId" = ${daoId}
          AND timestamp < ${BigInt(Date.now().toString().slice(0, 10))}
          ) 
          SELECT "fromZeroAddressOld"."fromAmount" - COALESCE("toZeroAddressOld"."toAmount", 0) as "oldTotalSupply" ,
          "fromZeroAddressCurrent"."fromAmount" - COALESCE("toZeroAddressCurrent"."toAmount", 0) as "currentTotalSupply"
          FROM "fromZeroAddressOld" 
          JOIN "toZeroAddressOld" ON 1=1
          JOIN "fromZeroAddressCurrent" ON 1=1
          JOIN "toZeroAddressCurrent" ON 1=1;
    `;
    const changeRate = formatUnits(
      BigInt(1e18) -
        (BigInt(totalSupplyCompare.currentTotalSupply) * BigInt(1e18)) /
          BigInt(totalSupplyCompare.oldTotalSupply),
      18,
    );
    return { ...totalSupplyCompare, changeRate };
  }

  async getDelegatedSupplyCompare(daoId: string, days: DaysEnum) {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days].toString());
    const [delegatedSupplyCompare]: [
      {
        oldDelegatedSupply: bigint;
        currentDelegatedSupply: bigint;
      },
    ] = await this.prisma.$queryRaw`
    WITH  "oldDelegatedSupplyByUser" as (
      select distinct on (vp."accountId") vp."accountId", vp.timestamp, vp."votingPower" as "oldDelegatedSupply"
      FROM "VotingPowerHistory" vp WHERE vp.timestamp<${BigInt(oldTimestamp.toString().slice(0, 10))}
      AND vp."daoId" = ${daoId}
      order by vp."accountId", vp.timestamp desc
    ) ,
   "currentDelegatedSupplyByUser"  as (
      select distinct on (vp."accountId") vp."accountId", vp.timestamp, vp."votingPower" as "currentDelegatedSupply"
      FROM "VotingPowerHistory" vp WHERE vp.timestamp<${BigInt(Date.now().toString().slice(0, 10))}
      AND vp."daoId" = ${daoId}
      order by vp."accountId", vp.timestamp desc
    ) 
    SELECT SUM("oldDelegatedSupplyByUser"."oldDelegatedSupply") as "oldDelegatedSupply", 
    SUM("currentDelegatedSupplyByUser"."currentDelegatedSupply") as "currentDelegatedSupply"
    FROM "oldDelegatedSupplyByUser"
    join "currentDelegatedSupplyByUser" on "oldDelegatedSupplyByUser"."accountId"="currentDelegatedSupplyByUser"."accountId";
    `;
    const changeRate = formatUnits(
      BigInt(1e18) -
        (BigInt(delegatedSupplyCompare.currentDelegatedSupply) * BigInt(1e18)) /
          BigInt(delegatedSupplyCompare.oldDelegatedSupply),
      18,
    );
    return { ...delegatedSupplyCompare, changeRate };
  }
}
