import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const daoId = createRoleDto.daoId;
    const dao = await this.prisma.dAO.findUnique({
      where: { id: daoId },
    });
    if (!dao) {
      throw new BadRequestException("Dao doesn't exist");
    }
    return this.prisma.role.create({ data: createRoleDto });
  }

  findMany(params: {
    skip?: number;
    take?: number;
  }) {
    const { skip, take} = params;
    return this.prisma.role.findMany({
      include: {
        users: true,
      },
      skip,
      take,
    });
  }

  findOne(id: number) {
    return this.prisma.role.findUnique({
      include: { users: true },
      where: { id },
    });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      data: updateRoleDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.role.delete({
      where: { id },
    });
  }

  grantRole(roleId: number, userId: string) {
    return this.prisma.userRole.create({
      data: {
        roleId,
        userId,
      },
    });
  }

  async removeRole(roleId: number, userId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
      },
    });
    return this.prisma.userRole.delete({ where: { id: userRole.id } });
  }
}
