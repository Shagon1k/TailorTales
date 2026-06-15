import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard.js';
import { USERS_LIST_DEFAULT_PAGE_SIZE } from './admin.constants.js';
import type { IAdminUserListPage } from './admin.types.js';
import { AdminUsersService } from './admin-users.service.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { UpdateSuspensionDto } from './dto/update-suspension.dto.js';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
    constructor(private readonly adminUsersService: AdminUsersService) {}

    @Get()
    list(
        @Query('search') search: string | undefined,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(USERS_LIST_DEFAULT_PAGE_SIZE), ParseIntPipe)
        pageSize: number,
    ): Promise<IAdminUserListPage> {
        return this.adminUsersService.list(search, page, pageSize);
    }

    /** Role changes are restricted to SUPER_ADMIN — a plain ADMIN cannot reach this. */
    @Patch(':id/role')
    @UseGuards(SuperAdminGuard)
    changeRole(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
    ): Promise<User> {
        return this.adminUsersService.changeRole(admin.id, id, dto.role);
    }

    @Patch(':id/suspension')
    setSuspension(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: UpdateSuspensionDto,
    ): Promise<User> {
        return this.adminUsersService.setSuspension(admin.id, id, dto.suspended);
    }
}
