import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CEXAddresses,
  DAOEnum,
  DEXAddresses,
  LendingAddresses,
  UNITreasuryAddresses,
  zeroAddress,
} from 'src/lib';
import { DaysEnum } from 'src/lib';
import { PrismaService } from 'src/prisma/prisma.service';
import { Address, formatUnits } from 'viem';
import {
  ActiveSupplyReturnType,
  CexSupplyCompareReturnType,
  CirculatingSupplyCompareReturnType,
  DAODto,
  DAOReturnType,
  DelegatedSupplyCompareReturnType,
  DelegatesReturnType,
  DexSupplyCompareReturnType,
  HoldersReturnType,
  LendingSupplyCompareReturnType,
  TotalSupplyCompareReturnType,
  TreasuryCompareReturnType,
} from './types';

@Injectable()
export class DaoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.dao.findMany();
  }

  async findOne(id: string): Promise<DAODto> {
    const dao = await this.prisma.dao.findUnique({
      where: { id },
      include: { daoTokens: { include: { token: true } } },
    });

    const totalSupply = dao.daoTokens[0].token.totalSupply;
    delete dao.daoTokens;
    return {
      ...dao,
      id: dao.id as DAOEnum,
      totalSupply: totalSupply,
    };
  }

  public async getDelegatesFromDao(
    daoId: string,
    fromDate: bigint,
    take: number,
    skip: number,
    orderBy: 'account' | 'delegationsCount' | 'votingPower' | 'proposalsVoted',
    ordering: 'ASC' | 'DESC',
    toDate: bigint,
  ): Promise<DelegatesReturnType> {
    const orderByValues = {
      account: 'a.id',
      delegationsCount: 'ap."delegations_count"',
      votingPower: 'ap."voting_power"',
      proposalsVoted: '"proposals_voted"',
    };

    const delegates: {
      account: Address;
      votingPower: string;
      proposalsVoted: string;
      delegationsCount: string;
    }[] = await this.prisma.$queryRawUnsafe(`
      select a.id as "account", 
      TEXT(ap."voting_power") as "voting_power", 
      TEXT(ap."delegations_count") as "delegations_count", 
      TEXT(COUNT(distinct voc.*)) as "proposals_voted" 
      from "account" a 
      left join "account_power" ap on a.id=ap."account_id"
      left join "votes_onchain" voc on voc."voter_account_id"=a.id
      where voc.timestamp BETWEEN CAST(${fromDate} as bigint) and CAST(${toDate} as bigint)
      AND ap."voting_power" is not null
      and ap."daoId"='${daoId}'
      group by a.id, ap."voting_power", ap."delegations_count"
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
  ): Promise<HoldersReturnType> {
    const orderByValues = {
      amount: 'ab.balance',
      account: 'a.id',
      lastBuy: 'Max(tr.timestamp)',
    };

    const getHoldersQuery = `
      select a.id as "account",
      TEXT(ab.balance) as "amount",
      TEXT(COUNT(d.*)) as "count_of_delegates",
      TEXT(MAX(tr.timestamp)) as "last_buy" from "account" a 
      left join "account_balance" ab on a.id=ab."account_id"
      right join "token" t on t.id =ab."token_id"
      right join "dao_token" dt on dt."token_id"=t.id
      right join "transfers" tr on tr."to_account_id"=a.id
      left join "delegations" d on a.id=d."delegator_account_id"
      where dt."dao_id"='${daoId}'
      group by a.id, ab.balance
      order by ${orderByValues[orderBy]} ${ordering || 'DESC'}
      offset ${skip ?? 0} limit ${take ?? 10};
      `;
    const holders: HoldersReturnType =
      await this.prisma.$queryRawUnsafe(getHoldersQuery);

    return holders;
  }

  async getTotalSupplyCompare(
    daoId: string,
    days: DaysEnum,
  ): Promise<TotalSupplyCompareReturnType> {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days]);
    const [totalSupplyCompare]: [
      Omit<TotalSupplyCompareReturnType, 'changeRate'>,
    ] = await this.prisma.$queryRaw`
          WITH "old_from_zero_address" as (
            SELECT SUM(t.amount) as "from_amount" 
            FROM "transfers" t 
            WHERE t."from_account_id"=${zeroAddress} 
          AND t."dao_id" = ${daoId}
          AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "old_to_zero_address" as (
            SELECT SUM(t.amount) as "to_amount" 
            FROM "transfers" t 
            WHERE t."to_account_id"=${zeroAddress} 
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "current_total_supply" as (
          SELECT SUM(ab.balance) as "balance" FROM "account_balance" ab
          )
          SELECT "old_from_zero_address"."from_amount" - COALESCE("old_to_zero_address"."to_amount", 0) as "old_total_supply",
          "current_total_supply"."balance" as "current_total_supply"
          FROM "old_from_zero_address" 
          JOIN "old_to_zero_address" on 1=1
          JOIN "current_total_supply" on 1=1;
    `;
    const changeRate = formatUnits(
      (BigInt(totalSupplyCompare.currentTotalSupply) * BigInt(1e18)) /
        BigInt(totalSupplyCompare.oldTotalSupply) -
        BigInt(1e18),
      18,
    );
    return { ...totalSupplyCompare, changeRate };
  }

  async getDelegatedSupplyCompare(
    daoId: string,
    days: DaysEnum,
  ): Promise<DelegatedSupplyCompareReturnType> {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days].toString());
    const [delegatedSupplyCompare]: [
      Omit<DelegatedSupplyCompareReturnType, 'changeRate'>,
    ] = await this.prisma.$queryRaw`
    WITH  "old_delegated_supply" as (
      SELECT SUM("old_delegated_supply_by_user"."old_delegated_supply") as "old_delegated_supply_amount" from (
        SELECT DISTINCT ON (vp."account_id") vp."account_id", vp.timestamp, vp."voting_power" AS "old_delegated_supply"
        FROM "voting_power_history" vp WHERE vp.timestamp<${BigInt(oldTimestamp.toString().slice(0, 10))}
        AND vp."dao_id" = ${daoId}
        ORDER BY vp."account_id", vp.timestamp DESC
      ) "old_delegated_supply_by_user"
   ),
   "current_delegated_supply"  AS (
      SELECT SUM(ap."voting_power") AS "current_delegated_supply_amount" FROM "account_power" ap
    )
    SELECT "old_delegated_supply"."old_delegated_supply_amount" AS "old_delegated_supply", 
    "current_delegated_supply"."current_delegated_supply_amount" AS "current_delegated_supply"
    FROM "current_delegated_supply"
    JOIN "old_delegated_supply" ON 1=1;
    `;
    const changeRate = formatUnits(
      (BigInt(delegatedSupplyCompare.currentDelegatedSupply) * BigInt(1e18)) /
        BigInt(delegatedSupplyCompare.oldDelegatedSupply) -
        BigInt(1e18),
      18,
    );
    return { ...delegatedSupplyCompare, changeRate };
  }

  async getCirculatingSupplyCompare(
    daoId: string,
    days: DaysEnum,
  ): Promise<CirculatingSupplyCompareReturnType> {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days].toString());
    const [circulatingSupplyCompare]: [
      Omit<CirculatingSupplyCompareReturnType, 'changeRate'>,
    ] = await this.prisma.$queryRaw`
          WITH "old_from_zero_address" as (
            SELECT SUM(t.amount) as "from_amount" 
            FROM "transfers" t 
            WHERE t."from_account_id"=${zeroAddress} 
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "old_to_zero_address" as (
            SELECT SUM(t.amount) as "to_amount" 
            FROM "transfers" t 
            WHERE t."to_account_id"=${zeroAddress} 
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "old_from_treasury" as (
            SELECT SUM(t.amount) as "from_amount" 
            FROM "transfers" t 
            WHERE t."from_account_id" IN (${Prisma.join(Object.values(UNITreasuryAddresses))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "old_to_treasury"as (
            SELECT SUM(t.amount) as "to_amount" 
            FROM "transfers" t 
            WHERE t."to_account_id" IN (${Prisma.join(Object.values(UNITreasuryAddresses))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "current_circulating_supply" as (
            SELECT SUM(ab.balance) AS "current_circulating_supply"
            FROM "account_balance" ab WHERE ab."account_id" NOT IN (${Prisma.join(Object.values(UNITreasuryAddresses))})
          )
          SELECT ("old_from_zero_address"."from_amount" - COALESCE("old_to_zero_address"."to_amount", 0)) - 
          (COALESCE("old_to_treasury"."to_amount", 0) - "old_from_treasury"."from_amount")
          as "old_circulating_supply",
          "current_circulating_supply"."current_circulating_supply"
          as "current_circulating_supply"
          FROM "old_from_zero_address" 
          JOIN "old_to_zero_address" ON 1=1
          JOIN "old_from_treasury" ON 1=1
          JOIN "old_to_treasury" ON 1=1
          JOIN "current_circulating_supply" ON 1=1;
    `;
    const changeRate = formatUnits(
      (BigInt(circulatingSupplyCompare.currentCirculatingSupply) *
        BigInt(1e18)) /
        BigInt(circulatingSupplyCompare.oldCirculatingSupply) -
        BigInt(1e18),
      18,
    );
    return { ...circulatingSupplyCompare, changeRate };
  }

  async getTreasuryCompare(
    daoId: string,
    days: DaysEnum,
  ): Promise<TreasuryCompareReturnType> {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days].toString());
    const [treasuryCompare]: [Omit<TreasuryCompareReturnType, 'changeRate'>] =
      await this.prisma.$queryRaw`
          WITH "old_from_treasury" as (
            SELECT SUM(t.amount) as "from_amount" 
            FROM "transfers" t 
            WHERE t."from_account_id" IN (${Prisma.join(Object.values(UNITreasuryAddresses))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "old_to_treasury" as (
            SELECT SUM(t.amount) as "to_amount" 
            FROM "transfers" t 
            WHERE t."to_account_id" IN (${Prisma.join(Object.values(UNITreasuryAddresses))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "current_treasury" as (
            SELECT SUM(ab.balance) AS "current_treasury"
            FROM "account_balance" ab WHERE ab."account_id" IN (${Prisma.join(Object.values(UNITreasuryAddresses))})
          )
          SELECT (COALESCE("old_to_treasury"."to_amount", 0) - "old_from_treasury"."from_amount")
          as "old_treasury",
          "current_treasury"."current_treasury"
          as "current_treasury"
          FROM "old_from_treasury"
          JOIN "old_to_treasury" ON 1=1
          JOIN "current_treasury" ON 1=1;
    `;
    const changeRate = formatUnits(
      (BigInt(treasuryCompare.currentTreasury) * BigInt(1e18)) /
        BigInt(treasuryCompare.oldTreasury) -
        BigInt(1e18),
      18,
    );
    return { ...treasuryCompare, changeRate };
  }

  async getCexSupplyCompare(
    daoId: string,
    days: DaysEnum,
  ): Promise<CexSupplyCompareReturnType> {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days].toString());
    const [cexCompare]: [Omit<CexSupplyCompareReturnType, 'changeRate'>] =
      await this.prisma.$queryRaw`
          WITH "old_from_cex" as (
            SELECT SUM(t.amount) as "from_amount" 
            FROM "transfers" t 
            WHERE UPPER(t."from_account_id") IN (${Prisma.join(Object.values(CEXAddresses).map((addr) => addr.toUpperCase()))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "old_to_cex" as (
            SELECT SUM(t.amount) as "to_amount" 
            FROM "transfers" t 
            WHERE UPPER(t."to_account_id") IN (${Prisma.join(Object.values(CEXAddresses).map((addr) => addr.toUpperCase()))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "current_cex_supply" as (
            SELECT SUM(ab.balance) AS "current_cex_supply"
            FROM "account_balance" ab WHERE UPPER(ab."account_id") IN (${Prisma.join(Object.values(CEXAddresses).map((addr) => addr.toUpperCase()))})
          )
          SELECT (COALESCE("old_to_cex"."to_amount", 0) - "old_from_cex"."from_amount")
          as "old_cex_supply",
          "current_cex_supply"."current_cex_supply"
          as "current_cex_supply"
          FROM "old_from_cex"
          JOIN "old_to_cex" ON 1=1
          JOIN "current_cex_supply" ON 1=1;
    `;
    const changeRate = formatUnits(
      (BigInt(cexCompare.currentCexSupply) * BigInt(1e18)) /
        BigInt(cexCompare.oldCexSupply) -
        BigInt(1e18),
      18,
    );
    return { ...cexCompare, changeRate };
  }

  async getDexSupplyCompare(
    daoId: string,
    days: DaysEnum,
  ): Promise<DexSupplyCompareReturnType> {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days].toString());
    const [dexCompare]: [Omit<DexSupplyCompareReturnType, 'changeRate'>] =
      await this.prisma.$queryRaw`
          WITH "old_from_dex" as (
            SELECT SUM(t.amount) as "from_amount" 
            FROM "transfers" t 
            WHERE UPPER(t."from_account_id") IN (${Prisma.join(Object.values(DEXAddresses).map((addr) => addr.toUpperCase()))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "old_to_dex" as (
            SELECT SUM(t.amount) as "to_amount" 
            FROM "transfers" t 
            WHERE UPPER(t."to_account_id") IN (${Prisma.join(Object.values(DEXAddresses).map((addr) => addr.toUpperCase()))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "current_dex_supply" as (
            SELECT SUM(ab.balance) AS "current_dex_supply"
            FROM "account_balance" ab WHERE UPPER(ab."account_id") IN (${Prisma.join(Object.values(DEXAddresses).map((addr) => addr.toUpperCase()))})
          )
          SELECT (COALESCE("old_to_dex"."to_amount",0) - "old_from_dex"."from_amount")
          as "old_dex_supply",
          "current_dex_supply"."current_dex_supply"
          as "current_dex_supply"
          FROM "old_from_dex"
          JOIN "old_to_dex" ON 1=1
          JOIN "current_dex_supply" ON 1=1;
    `;
    const changeRate = formatUnits(
      (BigInt(dexCompare.currentDexSupply) * BigInt(1e18)) /
        BigInt(dexCompare.oldDexSupply) -
        BigInt(1e18),
      18,
    );
    return { ...dexCompare, changeRate };
  }

  async getLendingSupply(
    daoId: string,
    days: DaysEnum,
  ): Promise<LendingSupplyCompareReturnType> {
    const oldTimestamp = BigInt(Date.now()) - BigInt(DaysEnum[days].toString());
    const [lendingCompare]: [
      Omit<LendingSupplyCompareReturnType, 'changeRate'>,
    ] = await this.prisma.$queryRaw`
          WITH "old_from_lending" as (
            SELECT SUM(t.amount) as "from_amount" 
            FROM "transfers" t 
            WHERE UPPER(t."from_account_id") IN (${Prisma.join(Object.values(LendingAddresses).map((addr) => addr.toUpperCase()))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "oldToLending" as (
            SELECT SUM(t.amount) as "to_amount" 
            FROM "transfers" t 
            WHERE UPPER(t."to_account_id") IN (${Prisma.join(Object.values(LendingAddresses).map((addr) => addr.toUpperCase()))})
            AND t."dao_id" = ${daoId}
            AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
          ),
          "current_lending_supply" as (
            SELECT SUM(ab.balance) AS "current_lending_supply"
            FROM "account_balance" ab WHERE UPPER(ab."account_id") IN (${Prisma.join(Object.values(LendingAddresses).map((addr) => addr.toUpperCase()))})
          )
          SELECT COALESCE(("old_to_lending"."to_amount" - "old_from_lending"."from_amount"),0)
          as "old_lending_supply",
          "current_lending_supply"."current_lending_supply"
          as "current_lending_supply"
          FROM "old_from_lending"
          JOIN "old_to_lending" ON 1=1
          JOIN "current_lending_supply" ON 1=1;
    `;
    const changeRate = formatUnits(
      (BigInt(lendingCompare.currentLendingSupply) * BigInt(1e18)) /
        BigInt(lendingCompare.oldLendingSupply) -
        BigInt(1e18),
      18,
    );
    return { ...lendingCompare, changeRate };
  }

  async getActiveSupply(daoId: string): Promise<ActiveSupplyReturnType> {
    const oldTimestamp =
      BigInt(Date.now()) - BigInt((180 * 86400000).toString());
    const [activeSupply]: [ActiveSupplyReturnType] = await this.prisma
      .$queryRaw`
        WITH  "active_users" as (
          SELECT DISTINCT ON (voc."voter_account_id") voc."voter_account_id", voc.timestamp
          FROM "votes_onchain" voc WHERE voc.timestamp>CAST(${oldTimestamp.toString().slice(0, 10)} as bigint)
          AND voc."dao_id" = ${daoId}
          ORDER BY voc."voter_account_id", voc.timestamp DESC
        )
        SELECT SUM(ap."voting_power") as "active_supply", TEXT(COUNT("active_users".*)) AS "active_users" FROM "account_power" ap
        JOIN "active_users" ON ap."account_id" = "active_users"."voter_account_id";
      `;
    return activeSupply;
  }

  // private async averageTurnout(id: string, fromDate: bigint, toDate: bigint) {
  //   const averageTurnout: [{ averageTurnout: string }] = await this.prisma
  //     .$queryRaw`
  //       select TEXT(AVG(po."forVotes" + po."againstVotes" + po."abstainVotes")) as "averageTurnout"
  //       from "ProposalsOnchain" po where po.timestamp BETWEEN CAST(${fromDate} as bigint) and CAST(${toDate} as bigint)
  //       AND po.status='EXECUTED' or po.status='CANCELED' AND po."daoId"=${id};
  //     `;
  //   return { ...averageTurnout[0] };
  // }

  // public async attackCosts(
  //   daoId: string,
  //   activeSince: bigint,
  //   votingPowerWithActivity: {
  //     totalDelegatesCount: string;
  //     totalVotingPower: string;
  //     activeDelegatesCount: string;
  //     activeVotingPower: string;
  //   },
  //   avgTurnoutAndApproval: {
  //     averageApprovalVotes: string;
  //     averageTurnout: string;
  //   },
  // ) {
  //   const batchSize = 2000;
  //   let { delegates: activeDelegates } = await this.getDelegatesFromDao(
  //     daoId,
  //     activeSince,
  //     batchSize,
  //     0,
  //     'votingPower',
  //     'DESC',
  //     BigInt(Date.now().toString()),
  //   );
  //   let { delegates } = await this.getDelegatesFromDao(
  //     daoId,
  //     0n,
  //     batchSize,
  //     0,
  //     'votingPower',
  //     'DESC',
  //     BigInt(Date.now().toString()),
  //   );
  //   let delegatesVotingPowerSum = 0n;
  //   let activeDelegatesVotingPowerSum = 0n;
  //   let topActiveDelegatesForAverageTurnout: number;
  //   let topActiveDelegatesForTotalVotingPower: number;
  //   let topActiveDelegatesForActiveVotingPower: number;
  //   let topDelegatesForAverageTurnout: number;
  //   let topDelegatesForTotalVotingPower: number;
  //   let topDelegatesForActiveVotingPower: number;
  //   let delegatesIdx: number = 0;
  //   let activeDelegatesIdx: number = 0;
  //   const averageTurnoutCost =
  //     BigInt(avgTurnoutAndApproval.averageTurnout) / 2n;
  //   const totalVotingPowerCost =
  //     BigInt(votingPowerWithActivity.totalVotingPower) / 2n;
  //   const activeVotingPowerCost =
  //     BigInt(votingPowerWithActivity.activeVotingPower) / 2n;
  //   while (
  //     activeDelegatesVotingPowerSum < totalVotingPowerCost &&
  //     delegatesVotingPowerSum < totalVotingPowerCost &&
  //     (topActiveDelegatesForAverageTurnout === undefined ||
  //       topActiveDelegatesForTotalVotingPower === undefined ||
  //       topActiveDelegatesForActiveVotingPower === undefined ||
  //       topDelegatesForAverageTurnout === undefined ||
  //       topDelegatesForTotalVotingPower === undefined ||
  //       topDelegatesForActiveVotingPower === undefined)
  //   ) {
  //     try {
  //       if (delegatesIdx === delegates.length) {
  //         const { delegates: delegatesToAppend } =
  //           await this.getDelegatesFromDao(
  //             daoId,
  //             0n,
  //             batchSize,
  //             delegates.length,
  //             'votingPower',
  //             'DESC',
  //             BigInt(Date.now().toString()),
  //           );
  //         delegates = [...delegates, ...delegatesToAppend];
  //         if (delegatesToAppend.length === 0) {
  //           topDelegatesForActiveVotingPower =
  //             topDelegatesForActiveVotingPower ?? 0;
  //           topDelegatesForTotalVotingPower =
  //             topDelegatesForTotalVotingPower ?? 0;
  //           topDelegatesForAverageTurnout = topDelegatesForAverageTurnout ?? 0;
  //         }
  //       }
  //       if (activeDelegatesIdx === activeDelegates.length) {
  //         const { delegates: activeDelegatesToAppend } =
  //           await this.getDelegatesFromDao(
  //             daoId,
  //             activeSince,
  //             batchSize,
  //             activeDelegates.length,
  //             'votingPower',
  //             'DESC',
  //             BigInt(Date.now().toString()),
  //           );
  //         activeDelegates = [...activeDelegates, ...activeDelegatesToAppend];
  //         if (activeDelegatesToAppend.length === 0) {
  //           topActiveDelegatesForActiveVotingPower =
  //             topActiveDelegatesForActiveVotingPower ?? 0;
  //           topActiveDelegatesForTotalVotingPower =
  //             topActiveDelegatesForTotalVotingPower ?? 0;
  //           topActiveDelegatesForAverageTurnout =
  //             topActiveDelegatesForAverageTurnout ?? 0;
  //         }
  //       }
  //       if (
  //         topDelegatesForTotalVotingPower === undefined ||
  //         topDelegatesForActiveVotingPower === undefined ||
  //         topDelegatesForAverageTurnout === undefined
  //       ) {
  //         delegatesVotingPowerSum += BigInt(
  //           delegates[delegatesIdx].votingPower,
  //         );
  //         delegatesIdx++;
  //       }

  //       if (
  //         topActiveDelegatesForTotalVotingPower === undefined ||
  //         topActiveDelegatesForActiveVotingPower === undefined ||
  //         topActiveDelegatesForAverageTurnout === undefined
  //       ) {
  //         activeDelegatesVotingPowerSum += BigInt(
  //           activeDelegates[activeDelegatesIdx].votingPower,
  //         );
  //         activeDelegatesIdx++;
  //       }

  //       // 1 - Active Delegates - Average Turnout
  //       if (
  //         !topActiveDelegatesForAverageTurnout &&
  //         activeDelegatesVotingPowerSum > averageTurnoutCost
  //       ) {
  //         topActiveDelegatesForAverageTurnout = delegatesIdx;
  //       }

  //       // 2 - Active Delegates - Active Voting Power
  //       if (
  //         !topActiveDelegatesForActiveVotingPower &&
  //         activeDelegatesVotingPowerSum > activeVotingPowerCost
  //       ) {
  //         topActiveDelegatesForActiveVotingPower = delegatesIdx;
  //       }
  //       // 3 - Active Delegates - Total Voting Power
  //       if (
  //         !topActiveDelegatesForTotalVotingPower &&
  //         activeDelegatesVotingPowerSum > totalVotingPowerCost
  //       ) {
  //         topActiveDelegatesForTotalVotingPower = delegatesIdx;
  //       }
  //       // 4 - Total Delegates - Average Turnout
  //       if (
  //         !topDelegatesForAverageTurnout &&
  //         delegatesVotingPowerSum > averageTurnoutCost
  //       ) {
  //         topDelegatesForAverageTurnout = delegatesIdx;
  //       }
  //       // 5 - Total Delegates - Active Voting Power
  //       if (
  //         !topDelegatesForActiveVotingPower &&
  //         delegatesVotingPowerSum > activeVotingPowerCost
  //       ) {
  //         topDelegatesForActiveVotingPower = delegatesIdx;
  //       }
  //       // 6 - Total Delegates - Total Voting Power
  //       if (
  //         !topDelegatesForTotalVotingPower &&
  //         delegatesVotingPowerSum > totalVotingPowerCost
  //       ) {
  //         topDelegatesForTotalVotingPower = delegatesIdx;
  //       }
  //     } catch (e) {
  //       console.error(e);
  //       console.log(activeDelegates.length);
  //       console.log(activeDelegatesIdx);
  //       console.log(activeDelegates[activeDelegatesIdx]);
  //       throw new Error('Error');
  //     }
  //   }
  //   if (
  //     topActiveDelegatesForAverageTurnout === undefined ||
  //     topActiveDelegatesForActiveVotingPower === undefined ||
  //     topActiveDelegatesForTotalVotingPower === undefined ||
  //     topDelegatesForAverageTurnout === undefined ||
  //     topDelegatesForActiveVotingPower === undefined ||
  //     topDelegatesForTotalVotingPower === undefined
  //   ) {
  //     throw new Error(
  //       "Error calculating attack costs: Some of the values didn't get calculated",
  //     );
  //   }
  //   return {
  //     averageTurnoutCost: String(averageTurnoutCost),
  //     totalVotingPowerCost: String(totalVotingPowerCost),
  //     activeVotingPowerCost: String(activeVotingPowerCost),
  //     topActiveDelegatesForAverageTurnout,
  //     topActiveDelegatesForActiveVotingPower,
  //     topActiveDelegatesForTotalVotingPower,
  //     topDelegatesForAverageTurnout,
  //     topDelegatesForActiveVotingPower,
  //     topDelegatesForTotalVotingPower,
  //   };
  // }
}
