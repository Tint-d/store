import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UserService } from '../../application/services/user.service';
import { UserQueryDto } from '../../application/dtos/user-query.dto';
import { User } from '../../domain/entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body()
    createUserDto: {
      email: string;
      name: string;
      username: string;
      password: string;
      role: string;
    },
  ) {
    return this.userService.createUser(
      createUserDto.email,
      createUserDto.name,
      createUserDto.username,
      createUserDto.password,
      createUserDto.role,
    );
  }

  @Get()
  async getAllUsers(@Query() query: UserQueryDto) {
    return await this.userService.getAllUsers(query);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    updateUserDto: {
      email?: string;
      name?: string;
      username?: string;
      role?: string;
      isActive?: boolean;
      isVerified?: boolean;
    },
  ): Promise<User> {
    return await this.userService.updateUserById(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
