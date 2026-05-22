import { Body, Controller, Get, Patch } from '@nestjs/common';
import { type User } from '../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';

@Controller('me')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    getMe(@CurrentUser() user: User): User {
        return user;
    }

    @Patch()
    updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<User> {
        return this.userService.updateName(user.id, dto.name);
    }
}
