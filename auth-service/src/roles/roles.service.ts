import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DaoService } from '../dao/dao.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaClient,
    private daoService: DaoService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const daoExists = await this.daoService.validateDaoExists(
      createRoleDto.daoId,
    );

    if (!daoExists) {
      throw new BadRequestException(
        `DAO with ID ${createRoleDto.daoId} not found`,
      );
    }

    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        daoId: createRoleDto.daoId,
        createdAt: BigInt(Date.now()),
      },
      include: {
        userRoles: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        userRoles: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByDao(daoId: string) {
    const daoExists = await this.daoService.validateDaoExists(daoId);

    if (!daoExists) {
      throw new BadRequestException(`DAO with ID ${daoId} not found`);
    }

    return this.prisma.role.findMany({
      where: { daoId },
      include: {
        userRoles: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    if (updateRoleDto.daoId) {
      const daoExists = await this.daoService.validateDaoExists(
        updateRoleDto.daoId,
      );
      if (!daoExists) {
        throw new BadRequestException(
          `DAO with ID ${updateRoleDto.daoId} not found`,
        );
      }
    }

    try {
      return await this.prisma.role.update({
        where: { id },
        data: updateRoleDto,
        include: {
          userRoles: {
            include: {
              user: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }
}
