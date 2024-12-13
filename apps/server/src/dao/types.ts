import { ApiProperty } from '@nestjs/swagger';
import { DAOEnum } from 'src/lib';
import { Address, zeroAddress } from 'viem';

export class DAOQueryReturnType {
  @ApiProperty({ enum: ['UNI'] })
  id: DAOEnum;
  @ApiProperty()
  quorum: string;
  @ApiProperty()
  proposalThreshold: string;
  @ApiProperty()
  votingDelay: string;
  @ApiProperty()
  votingPeriod: string;
  @ApiProperty()
  timelockDelay: string;
  @ApiProperty()
  totalSupply: string;
}

export class DelegatesReturnType {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        account: { type: 'string', example: zeroAddress },
        votingPower: { type: 'string', example: BigInt(1e18).toString() },
        delegationsCount: { type: 'string', example: BigInt(15).toString() },
        proposalsVoted: { type: 'string', example: BigInt(14).toString() },
      },
    },
  })
  delegates: {
    account: Address;
    votingPower: string;
    delegationsCount: string;
    proposalsVoted: string;
  }[];
  @ApiProperty({ type: 'number', example: 25 })
  totalProposals: number;
}

export class HoldersReturnType {
  @ApiProperty({ type: 'string', example: zeroAddress })
  account: string;
  @ApiProperty({ type: 'string', example: '382740854530740740750740737' })
  amount: string;
  @ApiProperty({ type: 'string', example: '0' })
  countOfDelegates: string;
  @ApiProperty({
    type: 'string',
    description: 'Last buy timestamp in seconds',
    example: '1714227707',
  })
  lastBuy: string;
}

export class TotalSupplyCompareReturnType {
  @ApiProperty({
    type: 'string',
    example: BigInt(1e18).toString(),
  })
  oldTotalSupply: string;
  @ApiProperty({
    type: 'string',
    example: BigInt(1e18).toString(),
  })
  currentTotalSupply: string;
  @ApiProperty({
    type: 'string',
    example: '0',
  })
  changeRate: string;
}

export class DelegatedSupplyCompareReturnType {
  @ApiProperty({
    type: 'string',
    example: BigInt(1e18).toString(),
  })
  oldDelegatedSupply: string;
  @ApiProperty({
    type: 'string',
    example: BigInt(1e18).toString(),
  })
  currentDelegatedSupply: string;
  @ApiProperty({
    type: 'string',
    example: '0',
  })
  changeRate: string;
}

export class CirculatingSupplyCompareReturnType {
  @ApiProperty({
    type: 'string',
    example: BigInt(1e18).toString(),
  })
  oldCirculatingSupply: string;
  
  @ApiProperty({
    type: 'string',
    example: BigInt(1e18).toString(),
  })
  currentCirculatingSupply: string;

  @ApiProperty({
    type: 'string',
    example: '0',
  })
  changeRate: string;
}