import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdateProfileDto,
  AdminUpdateUserDto,
  AdminCreateUserDto,
} from './dto';

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  profilePicture: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const USER_PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  profilePicture: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    await this.assertEmailAvailable(dto.email, userId);
    const hashedPassword = await this.hashPasswordIfProvided(dto.password);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: this.buildProfileUpdateData(dto, hashedPassword),
      select: USER_PROFILE_SELECT,
    });

    return updatedUser;
  }

  async findAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const whereCondition = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_PUBLIC_SELECT,
      }),
      this.prisma.user.count({ where: whereCondition }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOneWithRelations(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profilePicture: true,
        createdAt: true,
        favorites: {
          include: {
            destination: {
              select: {
                id: true,
                name: true,
                city: true,
                province: true,
                thumbnailUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        userReviews: {
          include: {
            destination: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        searchLogs: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async adminCreate(dto: AdminCreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email sudah digunakan');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        status: dto.status,
      },
      select: USER_PUBLIC_SELECT,
    });
  }

  async adminUpdate(id: number, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    await this.assertEmailAvailable(dto.email, id, 'Email sudah digunakan');
    const hashedPassword = await this.hashPasswordIfProvided(dto.password);

    return this.prisma.user.update({
      where: { id },
      data: this.buildAdminUpdateData(dto, hashedPassword),
      select: USER_PUBLIC_SELECT,
    });
  }

  async softDelete(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    return this.prisma.user.update({
      where: { id },
      data: { status: 'suspended' },
      select: { id: true, status: true },
    });
  }

  private async assertEmailAvailable(
    email?: string,
    currentUserId?: number,
    message = 'Email sudah digunakan oleh pengguna lain',
  ) {
    if (!email) return;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ConflictException(message);
    }
  }

  private async hashPasswordIfProvided(password?: string) {
    return password ? bcrypt.hash(password, 10) : undefined;
  }

  private buildProfileUpdateData(
    dto: UpdateProfileDto,
    hashedPassword?: string,
  ): Prisma.UserUpdateInput {
    const data = this.buildIdentityUpdateData(dto, hashedPassword);
    this.assignWhenDefined(data, 'profilePicture', dto.profilePicture);
    return data;
  }

  private buildAdminUpdateData(
    dto: AdminUpdateUserDto,
    hashedPassword?: string,
  ): Prisma.UserUpdateInput {
    const data = this.buildIdentityUpdateData(dto, hashedPassword);
    this.assignWhenPresent(data, 'role', dto.role);
    this.assignWhenPresent(data, 'status', dto.status);
    return data;
  }

  private buildIdentityUpdateData(
    dto: Pick<UpdateProfileDto | AdminUpdateUserDto, 'name' | 'email'>,
    hashedPassword?: string,
  ): Prisma.UserUpdateInput {
    const data: Prisma.UserUpdateInput = {};
    this.assignWhenPresent(data, 'name', dto.name);
    this.assignWhenPresent(data, 'email', dto.email);
    this.assignWhenPresent(data, 'password', hashedPassword);
    return data;
  }

  private assignWhenPresent<K extends keyof Prisma.UserUpdateInput>(
    data: Prisma.UserUpdateInput,
    key: K,
    value: Prisma.UserUpdateInput[K] | undefined,
  ) {
    if (value !== undefined && value !== '') {
      data[key] = value;
    }
  }

  private assignWhenDefined<K extends keyof Prisma.UserUpdateInput>(
    data: Prisma.UserUpdateInput,
    key: K,
    value: Prisma.UserUpdateInput[K] | undefined,
  ) {
    if (value !== undefined) {
      data[key] = value;
    }
  }
}
