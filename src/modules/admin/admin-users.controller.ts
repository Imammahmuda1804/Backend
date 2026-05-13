import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import {
  AdminUserQueryDto,
  AdminUpdateUserDto,
  AdminCreateUserDto,
} from '../users/dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async getUsers(@Query() query: AdminUserQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    return this.usersService.findAll(page, limit, query.search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user detail with relations' })
  @ApiResponse({
    status: 200,
    description: 'User detail with favorites, reviews, and search history',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetail(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneWithRelations(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user (admin)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async createUser(@Body() dto: AdminCreateUserDto) {
    return this.usersService.adminCreate(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user data (admin)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Suspend/Soft delete user' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.softDelete(id);
  }
}
