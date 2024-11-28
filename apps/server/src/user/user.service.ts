import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  findMany(params: {
    skip?: number;
    take?: number;
  }) {
    const { skip, take } = params;
    return this.prisma.user.findMany({
      include: {
        roles: true,
      },
      skip,
      take,
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      include: {
        roles: true,
      },
      where: { id },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
