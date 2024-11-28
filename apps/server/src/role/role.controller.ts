import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBody, ApiQuery, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiBody({
    required: true,
    type: 'CreateRoleDto',
    examples: {
      0: {
        value: {
          name: 'ADMIN',
          daoId: 'UNI',
        },
      },
    },
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
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
  findMany(
    @Query('skip', new DefaultValuePipe(0)) skip?: number,
    @Query('take', new DefaultValuePipe(10)) take?: number,
  ) {
    return this.roleService.findMany({ skip, take });
  }

  @ApiParam({
    name: 'id',
    description: "Unique identifier of the role to be found"
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(+id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    description: "Unique identifier of the role to be changed"
  })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: "Unique identifier of the role to be deleted"
  })
  remove(@Param('id') id: string) {
    return this.roleService.remove(+id);
  }

  @Patch('/grant/:id')
  @ApiParam({
    name: 'id',
    description: "Unique identifier of the role to be granted"
  })
  @ApiParam({
    name: 'userId',
    description: "Unique identifier of the user for the role to be granted"
  })
  grantRole(@Param('id') id: string, @Query('userId') userId: string) {
    return this.roleService.grantRole(+id, userId);
  }

  @Patch('/remove-role/:id')
  @ApiParam({
    name: 'id',
    description: "Unique identifier of the role to be removed from user"
  })
  @ApiParam({
    name: 'userId',
    description: "Unique identifier of the user for the role to be removed from"
  })
  removeRole(@Param('id') id: string, @Query('userId') userId: string) {
    return this.roleService.removeRole(+id, userId);
  }
}
