import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';

class CreateProfileDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  modules: string[];

  @IsOptional()
  @IsString()
  systemKey?: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  accessProfileId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  accessProfileId?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Roles(Role.ADMIN)
  @Get('modules')
  modules() {
    return this.users.listModules();
  }

  @Roles(Role.ADMIN)
  @Get('profiles')
  profiles() {
    return this.users.listProfiles();
  }

  @Roles(Role.ADMIN)
  @Post('profiles')
  createProfile(@Body() dto: CreateProfileDto) {
    return this.users.createProfile(dto);
  }

  @Roles(Role.ADMIN)
  @Patch('profiles/:id')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('profiles/:id')
  deleteProfile(@Param('id') id: string) {
    return this.users.deleteProfile(id);
  }

  @Roles(Role.ADMIN)
  @Get()
  list() {
    return this.users.listUsers();
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.createUser(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.updateUser(id, dto);
  }
}
