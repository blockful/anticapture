import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiQuery, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiBody({
    required: true,
    type: 'CreateUserDto',
    examples: {
      0: {
        value: {
          id: '0x0000000000000000000000000000000000000000',
        },
      },
    },
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

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
  findMany(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.userService.findMany({ skip, take });
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: "Unique identifier of the user to be found"
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: "Unique identifier of the user to be deleted"
  })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
