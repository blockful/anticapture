import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClient } from '@prisma/client';
import { GraphQLService } from 'src/graphql/graphql.service';
import { GET_ACCOUNT_QUERY } from 'src/graphql/queries';
import { UpsertUserAccountDto } from './dto/upsert-user-account.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaClient,
    private graphqlService: GraphQLService,
  ) {}

  async upsertUserAccount(dto: UpsertUserAccountDto) {
    // First verify account exists in GraphQL
    const accountData = await this.graphqlService.query(GET_ACCOUNT_QUERY, {
      id: dto.address,
    });

    if (!accountData?.account) {
      throw new BadRequestException(
        `Account with address ${dto.address} not found in GraphQL database`,
      );
    }

    try {
      // Upsert the account in local PostgreSQL
      const account = await this.prisma.account.upsert({
        where: { id: dto.address },
        create: { id: dto.address },
        update: {},
      });

      // Find existing user or create new one
      const existingUser = await this.prisma.user.findUnique({
        where: { address: dto.address },
      });

      let user;
      if (existingUser) {
        // Update existing user
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            // Add any fields you want to update
          },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            address: dto.address,
          },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });
      }

      return {
        account,
        user,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upsert user account: ${error.message}`,
      );
    }
  }

  async findUserWithAccount(address: string) {
    return this.prisma.user.findUnique({
      where: { address },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    // Verify account exists in GraphQL
    const accountData = await this.graphqlService.query(GET_ACCOUNT_QUERY, {
      id: createUserDto.address,
    });

    if (!accountData?.account) {
      throw new BadRequestException(
        `Account with address ${createUserDto.address} not found in GraphQL database`,
      );
    }

    return this.prisma.user.create({
      data: {
        address: createUserDto.address,
      },
      include: {
        account: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        account: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        account: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByAddress(address: string) {
    return this.prisma.user.findFirst({
      where: { address },
      include: {
        account: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        account: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async remove(id: number) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
