import { Body, Controller, Delete, Get, Header, Patch, Res } from '@nestjs/common';
import type { Response } from 'express';
import { type User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { DataExportService } from './data-export.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';

const COOKIE_NAME = 'access_token';

@Controller('me')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly dataExportService: DataExportService,
        private readonly accountDeletionService: AccountDeletionService,
    ) {}

    @Get()
    getMe(@CurrentUser() user: User): User {
        return user;
    }

    @Patch()
    updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<User> {
        return this.userService.updateName(user.id, dto.name);
    }

    /** GDPR data export — structured JSON download with signed asset links. */
    @Get('export')
    @Header('Content-Disposition', 'attachment; filename="tailortales-export.json"')
    exportData(@CurrentUser() user: User): Promise<Record<string, unknown>> {
        return this.dataExportService.exportUserData(user.id);
    }

    /** GDPR account deletion — cancels billing, removes all data and assets. */
    @Delete()
    async deleteMe(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
        await this.accountDeletionService.deleteAccount(user.id);
        res.clearCookie(COOKIE_NAME);
        res.sendStatus(204);
    }
}
