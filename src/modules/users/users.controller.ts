import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerProfileImageOptions } from '../../config/multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UserResponseDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Dapatkan profil user saat ini' })
  @ApiResponse({
    status: 200,
    description: 'Profil user',
    type: UserResponseDto,
  })
  async getProfile(
    @CurrentUser() user: { id: number; email: string; role: string },
  ) {
    return this.usersService.findById(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update profil user saat ini' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profil berhasil diperbarui',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email sudah digunakan' })
  async updateProfile(
    @CurrentUser() user: { id: number; email: string; role: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload foto profil user' })
  @ApiResponse({ status: 200, description: 'Avatar berhasil diperbarui' })
  @UseInterceptors(FileInterceptor('file', multerProfileImageOptions))
  async uploadAvatar(
    @CurrentUser() user: { id: number; email: string; role: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const profilePicture = `/uploads/profiles/${file.filename}`;
    return this.usersService.updateProfile(user.id, { profilePicture });
  }
}
