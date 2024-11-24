import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { Prisma } from '@prisma/client';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiQuery({
    name: 'skip',
    required: false,
    default: 0,
    description: 'Quantity of elements to be skipped during the data fetching',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    default: 10,
    description: 'Size of the array to be returned',
  })
  findMany(
    @Query('skip', new ParseIntPipe(), new DefaultValuePipe(0)) skip?: number,
    @Query('take', new ParseIntPipe(), new DefaultValuePipe(10)) take?: number,
  ) {
    return this.accountService.findMany({ skip, take });
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'Unique identifier of the account to be finded, a.k.a. Wallet address',
  })
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }
}
