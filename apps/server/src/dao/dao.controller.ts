import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { DaoService } from './dao.service';
import { RequiredPipe } from 'src/lib/custom-pipes/requiredPipe';
import { DaysEnum } from 'src/lib';
import { DAOEnum } from 'src/lib';
import { Prisma } from '@prisma/client';
import {
  ActiveSupplyReturnType,
  CexSupplyCompareReturnType,
  CirculatingSupplyCompareReturnType,
  DAOReturnType,
  DelegatedSupplyCompareReturnType,
  DelegatesReturnType,
  DexSupplyCompareReturnType,
  HoldersReturnType,
  LendingSupplyCompareReturnType,
  TotalSupplyCompareReturnType,
  TreasuryCompareReturnType,
} from './types';

@ApiTags('dao')
@Controller('dao')
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @Get()
  findAll() {
    return this.daoService.findAll();
  }

  @Get(':daoId')
  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiOkResponse({
    description: 'Dao Information',
    type: DAOReturnType,
  })
  findOne(@Param('daoId') daoId: string) {
    return this.daoService.findOne(daoId);
  }

  @Get(':daoId/delegates')
  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiQuery({
    name: 'fromDate',
    required: true,
    description:
      'Timestamp to be used as a lower limit for the proposals voted',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description:
      'Timestamp to be used as an upper limit for the proposals voted',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Size of the array to be returned',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Quantity of elements to be skipped during the data fetching',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description:
      "Filter to Order By: 'account' | 'delegationsCount' | 'votingPower' | 'proposalsVoted'",
    default: 'votingPower',
  })
  @ApiQuery({
    name: 'ordering',
    required: false,
    description: 'DESC for descending order, ASC for ascending order',
    default: 'DESC',
  })
  @ApiOkResponse({
    description: 'Dao Delegates',
    type: DelegatesReturnType,
  })
  getDelegatesFromDao(
    @Param('daoId') daoId: string,
    @Query('fromDate', new RequiredPipe()) fromDate: number,
    @Query('toDate', new DefaultValuePipe(Date.now())) toDate?: number,
    @Query('take', new DefaultValuePipe(10)) take?: number,
    @Query('skip', new DefaultValuePipe(0)) skip?: number,
    @Query('orderBy', new DefaultValuePipe('votingPower'))
    orderBy?: 'account' | 'delegationsCount' | 'votingPower' | 'proposalsVoted',
    @Query('ordering', new DefaultValuePipe('DESC')) ordering?: 'ASC' | 'DESC',
  ) {
    return this.daoService.getDelegatesFromDao(
      daoId,
      BigInt(fromDate),
      take,
      skip,
      orderBy,
      ordering,
      BigInt(toDate),
    );
  }

  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Size of the array to be returned',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Quantity of elements to be skipped during the data fetching',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: "Filter to Order By: 'account' | 'amount' | 'lastBuy'",
    default: 'amount',
  })
  @ApiQuery({
    name: 'ordering',
    required: false,
    description: 'DESC for descending order, ASC for ascending order',
    default: 'DESC',
  })
  @ApiOkResponse({
    description: 'Dao Holders',
    type: HoldersReturnType,
    isArray: true,
  })
  @Get(':daoId/holders')
  getHoldersFromDao(
    @Param('daoId') daoId: string,
    @Query('take', new DefaultValuePipe(10)) take?: number,
    @Query('skip', new DefaultValuePipe(0)) skip?: number,
    @Query('orderBy', new DefaultValuePipe('amount'))
    orderBy?: 'account' | 'amount' | 'lastBuy',
    @Query('ordering', new DefaultValuePipe('DESC')) ordering?: 'ASC' | 'DESC',
  ) {
    return this.daoService.getHoldersFromDao(
      daoId,
      take,
      skip,
      orderBy,
      ordering,
    );
  }

  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiParam({
    name: 'timeInterval',
    required: true,
    description: 'Time interval in days. Ex.: 7d, 30d, 90d, 365d.',
    enum: DaysEnum,
  })
  @ApiOkResponse({
    description: 'Dao Total Supply',
    type: TotalSupplyCompareReturnType,
  })
  @Get('/:daoId/total-supply/compare')
  getTotalSupplyCompare(
    @Param('daoId') daoId: string,
    @Query('timeInterval') timeInterval: DaysEnum,
  ) {
    return this.daoService.getTotalSupplyCompare(daoId, timeInterval);
  }

  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiParam({
    name: 'timeInterval',
    required: true,
    description: 'Time interval in days. Ex.: 7d, 30d, 90d, 365d.',
    enum: DaysEnum,
  })
  @ApiOkResponse({
    description: 'Dao Delegated Supply',
    type: DelegatedSupplyCompareReturnType,
  })
  @Get(':daoId/delegated-supply/compare')
  getDelegatedSupplyCompare(
    @Param('daoId') daoId: string,
    @Query('timeInterval') timeInterval: DaysEnum,
  ) {
    return this.daoService.getDelegatedSupplyCompare(daoId, timeInterval);
  }

  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiParam({
    name: 'timeInterval',
    required: true,
    description: 'Time interval in days. Ex.: 7d, 30d, 90d, 365d.',
    enum: DaysEnum,
  })
  @ApiOkResponse({
    description: 'Dao Delegated Supply',
    type: CirculatingSupplyCompareReturnType,
  })
  @Get(':daoId/circulating-supply/compare')
  getCirculatingSupplyCompare(
    @Param('daoId') daoId: string,
    @Query('timeInterval') timeInterval: DaysEnum,
  ) {
    return this.daoService.getCirculatingSupplyCompare(daoId, timeInterval);
  }

  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiParam({
    name: 'timeInterval',
    required: true,
    description: 'Time interval in days. Ex.: 7d, 30d, 90d, 365d.',
    enum: DaysEnum,
  })
  @ApiOkResponse({
    description: 'Dao Delegated Supply',
    type: TreasuryCompareReturnType,
  })
  @Get(':daoId/treasury/compare')
  getTreasuryCompare(
    @Param('daoId') daoId: string,
    @Query('timeInterval') timeInterval: DaysEnum,
  ) {
    return this.daoService.getTreasuryCompare(daoId, timeInterval);
  }

  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiParam({
    name: 'timeInterval',
    required: true,
    description: 'Time interval in days. Ex.: 7d, 30d, 90d, 365d.',
    enum: DaysEnum,
  })
  @ApiOkResponse({
    description: 'Cex Supply Return Object',
    type: CexSupplyCompareReturnType,
  })
  @Get(':daoId/cex-supply/compare')
  getCexSupplyCompare(
    @Param('daoId') daoId: string,
    @Query('timeInterval') timeInterval: DaysEnum,
  ) {
    return this.daoService.getCexSupplyCompare(daoId, timeInterval);
  }

  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiParam({
    name: 'timeInterval',
    required: true,
    description: 'Time interval in days. Ex.: 7d, 30d, 90d, 365d.',
    enum: DaysEnum,
  })
  @ApiOkResponse({
    description: 'Dex Supply Return Object',
    type: DexSupplyCompareReturnType,
  })
  @Get(':daoId/dex-supply/compare')
  getDexSupplyCompare(
    @Param('daoId') daoId: string,
    @Query('timeInterval') timeInterval: DaysEnum,
  ) {
    return this.daoService.getDexSupplyCompare(daoId, timeInterval);
  }

  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
    enum: DAOEnum,
  })
  @ApiParam({
    name: 'timeInterval',
    required: true,
    description: 'Time interval in days. Ex.: 7d, 30d, 90d, 365d.',
    enum: DaysEnum,
  })
  @ApiOkResponse({
    description: 'Lending Supply Return Object',
    type: LendingSupplyCompareReturnType,
  })
  @Get(':daoId/lending-supply/compare')
  getLendingSupply(
    @Param('daoId') daoId: string,
    @Query('timeInterval') timeInterval: DaysEnum,
  ) {
    return this.daoService.getLendingSupply(daoId, timeInterval);
  }

  @ApiOkResponse({
    description: 'Active Supply Return Object',
    type: ActiveSupplyReturnType,
  })
  @Get(':daoId/active-supply')
  getActiveSupply(@Param('daoId') daoId: string) {
    return this.daoService.getActiveSupply(daoId);
  }
}
