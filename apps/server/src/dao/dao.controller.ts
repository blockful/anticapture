import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DaoService } from './dao.service';
import { RequiredPipe } from 'src/lib/custom-pipes/requiredPipe';
import { DaysEnum } from 'src/lib/enums/dateEnum';

@ApiTags('dao')
@Controller('dao')
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @Get()
  findAll() {
    return this.daoService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
  })
  @ApiQuery({
    name: 'activeSince',
    required: true,
    description: 'Timestamp to be used to get active users from this date on',
  })
  @ApiQuery({
    name: 'avgFromDate',
    required: true,
    description:
      'Timestamp to be used as a lower limit for average turnout and approval votes calculation',
  })
  @ApiQuery({
    name: 'avgToDate',
    required: false,
    description:
      'Timestamp to be used as an upper limit for average turnout and approval votes calculation',
    default: '${Date.now().toString()}',
  })
  findOne(
    @Param('id') id: string,
    @Query('activeSince', new RequiredPipe<bigint>()) activeSince: bigint,
    @Query('avgFromDate', new RequiredPipe<string>()) avgFromDate: number,
    @Query('avgToDate', new DefaultValuePipe(parseInt(Date.now().toString())))
    avgToDate: number,
  ) {
    return this.daoService.findOne(
      id,
      activeSince,
      BigInt(avgFromDate),
      BigInt(avgToDate),
    );
  }

  @Get('delegates/:daoId')
  @ApiParam({
    name: 'daoId',
    required: true,
    description: 'Id of the DAO. Ex.: UNI, ENS, COMP...',
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
  @Get('holders/:daoId')
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
  })
  @Get('total-supply/compare/:daoId')
  getTotalSupplyCompare(
    @Param('daoId') daoId: string,
    @Query('days', new DefaultValuePipe(1)) days?: DaysEnum,
  ) {
    return this.daoService.getTotalSupplyCompare(
      daoId,
      days,
    );
  }
}
